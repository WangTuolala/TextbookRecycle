const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Find and replace loadProfileData and saveProfile
const oldLoadSave = `async function loadProfileData() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) return;
        
        const result = await adminApiCall(\`/users/\${currentUser.id}\`, 'GET');
        if (!result.success) return;
        
        const user = result.data;
        
        document.getElementById('profileUsername').innerText = user.username || '-';
        document.getElementById('profileName').innerText = user.name || '-';
        document.getElementById('profileDept').innerText = user.college || '-';
document.getElementById('profileYear').innerText = user.year || '-';
        document.getElementById('profilePhone').innerText = user.phone || '-';
        document.getElementById('profileLocation').innerText = user.major || '-';
        
        // 更新sessionStorage中的用户信息
        const updatedUser = { ...currentUser, name: user.name };
        sessionStorage.setItem('current_user', JSON.stringify(updatedUser));
        
        // 填充弹窗表单
        document.querySelector('#infoModal input[placeholder="姓名"]').value = user.name || '';
        document.querySelector('#infoModal input[placeholder="部门"]').value = user.college || '';
        document.querySelector('#infoModal input[placeholder="入职年份"]').value = user.year || '';
        document.querySelector('#infoModal input[placeholder="联系电话"]').value = user.phone || '';
        document.querySelector('#infoModal input[placeholder="工作地点"]').value = user.major || '';
        
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
        
        const name = document.querySelector('#infoModal input[placeholder="姓名"]').value.trim();
        const college = document.querySelector('#infoModal input[placeholder="部门"]').value.trim();
        const phone = document.querySelector('#infoModal input[placeholder="联系电话"]').value.trim();
        const year = document.querySelector('#infoModal input[placeholder="入职年份"]').value.trim();
        const major = document.querySelector('#infoModal input[placeholder="工作地点"]').value.trim();
        
        if (!name) {
            alert('姓名不能为空');
            return;
        }
        
        const payload = { name, college, phone, year, major };
        const result = await adminApiCall(\`/users/\${currentUser.id}\`, 'PUT', payload);
        
        if (result.success) {
            alert('保存成功');
            Modal.close('infoModal');
            await loadProfileData();
        } else {
            alert(result.message || '保存失败');
        }
    } catch (error) {
        alert(error.message);
    }
}`;

const newLoadSave = `async function loadProfileData() {
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

        // 填充展示区
        const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.innerText = val || '-'; };
        setEl('profileUsername', user.username);
        setEl('profileName', user.name);
        setEl('profilePhone', user.phone);

        // 更新sessionStorage
        const updatedUser = { ...currentUser, name: user.name };
        sessionStorage.setItem('current_user', JSON.stringify(updatedUser));

        // 填充弹窗表单（使用ID）
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
            // 同步更新导航栏用户名
            const nameEl = document.getElementById('adminUserName');
            if (nameEl) nameEl.innerHTML = '&#128100; ' + name;
        } else {
            alert(result.message || '保存失败');
        }
    } catch (error) {
        alert(error.message);
    }
}`;

if (c.includes(oldLoadSave)) {
    c = c.replace(oldLoadSave, newLoadSave);
    console.log('Replaced loadProfileData and saveProfile');
} else {
    console.log('Pattern not found');
}

fs.writeFileSync(path, c, 'utf8');
console.log('done');
