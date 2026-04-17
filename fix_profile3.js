const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

const startIdx = c.indexOf('async function loadProfileData() {');
const endIdx = c.indexOf('// ==================== 积分规则页面 ====================');

if (startIdx === -1) {
    console.log('loadProfileData not found at', startIdx);
} else if (endIdx === -1) {
    console.log('rule marker not found');
} else {
    const before = c.slice(0, startIdx);
    const after = c.slice(endIdx);
    const newBlock = `async function loadProfileData() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) {
            console.warn('未登录，无法加载个人信息');
            return;
        }

        const result = await adminApiCall(\`/users/\${currentUser.id}\`, 'GET');
        if (!result.success) {
            console.error('加载个人信息失败', result.message);
            return;
        }

        const user = result.data;

        const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.innerText = val || '-'; };
        setEl('profileUsername', user.username);
        setEl('profileName', user.name);
        setEl('profilePhone', user.phone);

        const updatedUser = { ...currentUser, name: user.name };
        sessionStorage.setItem('current_user', JSON.stringify(updatedUser));

        const editName = document.getElementById('editName');
        const editPhone = document.getElementById('editPhone');
        if (editName) editName.value = user.name || '';
        if (editPhone) editPhone.value = user.phone || '';

    } catch (error) {
        console.error('加载个人信息失败:', error);
    }
}

async function saveProfile() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) {
            alert('用户未登录');
            return;
        }

        const name = document.getElementById('editName').value.trim();
        const phone = document.getElementById('editPhone').value.trim();

        if (!name) {
            alert('姓名不能为空');
            return;
        }

        const payload = { name };
        if (phone) payload.phone = phone;

        const result = await adminApiCall(\`/users/\${currentUser.id}\`, 'PUT', payload);

        if (result.success) {
            alert('保存成功');
            Modal.close('infoModal');
            await loadProfileData();
            const nameEl = document.getElementById('adminUserName');
            if (nameEl) nameEl.innerHTML = '&#128100; ' + name;
        } else {
            alert(result.message || '保存失败');
        }
    } catch (error) {
        alert(error.message);
    }
}

`;

    c = before + newBlock + after;
    fs.writeFileSync(path, c, 'utf8');
    console.log('done, new size:', c.length);
}
