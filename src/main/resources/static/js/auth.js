// ==================== 用户数据存储 ====================
function loadUsersFromStorage() {
    const users = localStorage.getItem('glu_users');
    if (users) {
        return JSON.parse(users);
    }
    return null;
}

function saveUsersToStorage(users) {
    localStorage.setItem('glu_users', JSON.stringify(users));
}

let users = loadUsersFromStorage();

// ==================== 注册相关函数 ====================
function openRegisterModal() {
    document.getElementById('regUsername').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regConfirmPassword').value = '';
    resetProfileForms();
    const role = document.getElementById('regRole').value;
    updateProfileForm(role);
    updateRequiredFields(role);
    document.getElementById('registerStep1').style.display = 'block';
    document.getElementById('registerStep2').style.display = 'none';
    Modal.open('registerModal');
}

function onRoleChange() {
    const role = document.getElementById('regRole').value;
    updateRequiredFields(role);
}

function updateRequiredFields(role) {
    const studentIdRequired = document.getElementById('studentIdRequired');
    const studentNameRequired = document.getElementById('studentNameRequired');
    if (role === 'student') {
        if (studentIdRequired) studentIdRequired.style.display = 'inline';
        if (studentNameRequired) studentNameRequired.style.display = 'inline';
    } else {
        if (studentIdRequired) studentIdRequired.style.display = 'none';
        if (studentNameRequired) studentNameRequired.style.display = 'none';
    }
}

function resetProfileForms() {
    ['studentId', 'studentName', 'studentCollege', 'studentMajor', 'studentClass', 'studentYear', 'studentPhone'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['adminId', 'adminName', 'adminDept', 'adminPosition', 'adminYear', 'adminPhone', 'adminWorkplace'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['logisticsId', 'logisticsName', 'logisticsDept', 'logisticsPosition', 'logisticsYear', 'logisticsPhone', 'logisticsWorkplace'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

function closeRegisterModal() {
    Modal.close('registerModal');
}

function updateProfileForm(role) {
    const studentForm = document.getElementById('studentProfileForm');
    const adminForm = document.getElementById('adminProfileForm');
    const logisticsForm = document.getElementById('logisticsProfileForm');
    studentForm.style.display = 'none';
    adminForm.style.display = 'none';
    logisticsForm.style.display = 'none';
    if (role === 'student') {
        studentForm.style.display = 'block';
    } else if (role === 'admin') {
        adminForm.style.display = 'block';
    } else if (role === 'logistics') {
        logisticsForm.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const regRole = document.getElementById('regRole');
    if (regRole) {
        regRole.addEventListener('change', function() {
            updateProfileForm(this.value);
            updateRequiredFields(this.value);
        });
    }
});

function validateAccount() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const role = document.getElementById('regRole').value;

    if (!username) { showMessage('请输入账号'); return false; }
    if (!password) { showMessage('请输入密码'); return false; }
    if (password.length < 6) { showMessage('密码长度不能少于6位'); return false; }
    if (password !== confirmPassword) { showMessage('两次输入的密码不一致'); return false; }
    return true;
}

function validateProfile(role) {
    if (role === 'student') {
        const studentId = document.getElementById('studentId')?.value.trim();
        const studentName = document.getElementById('studentName')?.value.trim();
        if (!studentId) { showMessage('请填写学号'); return false; }
        if (!studentName) { showMessage('请填写姓名'); return false; }
        if (studentId.length < 5) { showMessage('学号长度不能少于5位'); return false; }
        return true;
    } else if (role === 'admin' || role === 'logistics') {
        const prefix = role === 'admin' ? 'admin' : 'logistics';
        const id = document.getElementById(prefix + 'Id')?.value.trim();
        const name = document.getElementById(prefix + 'Name')?.value.trim();
        const dept = document.getElementById(prefix + 'Dept')?.value.trim();
        const position = document.getElementById(prefix + 'Position')?.value.trim();
        const year = document.getElementById(prefix + 'Year')?.value.trim();
        const phone = document.getElementById(prefix + 'Phone')?.value.trim();
        const workplace = document.getElementById(prefix + 'Workplace')?.value.trim();
        if (!id) { showMessage('请填写工号'); return false; }
        if (!name) { showMessage('请填写姓名'); return false; }
        if (!dept) { showMessage('请填写部门'); return false; }
        if (!position) { showMessage('请填写岗位'); return false; }
        if (!year) { showMessage('请填写入职年份'); return false; }
        if (!phone) { showMessage('请填写联系电话'); return false; }
        if (!workplace) { showMessage('请填写工作地点'); return false; }
        return true;
    }
    return false;
}

function nextToProfile() {
    if (!validateAccount()) return;
    sessionStorage.setItem('temp_username', document.getElementById('regUsername').value.trim());
    sessionStorage.setItem('temp_password', document.getElementById('regPassword').value);
    sessionStorage.setItem('temp_role', document.getElementById('regRole').value);
    document.getElementById('registerStep1').style.display = 'none';
    document.getElementById('registerStep2').style.display = 'block';
}

function prevToAccount() {
    document.getElementById('registerStep1').style.display = 'block';
    document.getElementById('registerStep2').style.display = 'none';
}

function collectProfile(role) {
    const profile = {};
    if (role === 'student') {
        profile.studentId = document.getElementById('studentId')?.value.trim() || '';
        profile.name = document.getElementById('studentName')?.value.trim() || '';
        profile.college = document.getElementById('studentCollege')?.value.trim() || '';
        profile.major = document.getElementById('studentMajor')?.value.trim() || '';
        profile.class = document.getElementById('studentClass')?.value.trim() || '';
        profile.year = document.getElementById('studentYear')?.value.trim() || '';
        profile.phone = document.getElementById('studentPhone')?.value.trim() || '';
    } else if (role === 'admin') {
        profile.adminId = document.getElementById('adminId')?.value.trim() || '';
        profile.name = document.getElementById('adminName')?.value.trim() || '';
        profile.dept = document.getElementById('adminDept')?.value.trim() || '';
        profile.position = document.getElementById('adminPosition')?.value.trim() || '';
        profile.year = document.getElementById('adminYear')?.value.trim() || '';
        profile.phone = document.getElementById('adminPhone')?.value.trim() || '';
        profile.workplace = document.getElementById('adminWorkplace')?.value.trim() || '';
    } else if (role === 'logistics') {
        profile.logisticsId = document.getElementById('logisticsId')?.value.trim() || '';
        profile.name = document.getElementById('logisticsName')?.value.trim() || '';
        profile.dept = document.getElementById('logisticsDept')?.value.trim() || '';
        profile.position = document.getElementById('logisticsPosition')?.value.trim() || '';
        profile.year = document.getElementById('logisticsYear')?.value.trim() || '';
        profile.phone = document.getElementById('logisticsPhone')?.value.trim() || '';
        profile.workplace = document.getElementById('logisticsWorkplace')?.value.trim() || '';
    }
    return profile;
}

async function completeRegistration() {
    const username = sessionStorage.getItem('temp_username');
    const password = sessionStorage.getItem('temp_password');
    const role = sessionStorage.getItem('temp_role');

    if (!username || !password || !role) {
        showMessage('注册信息丢失，请重新注册');
        closeRegisterModal();
        return;
    }

    if (!validateProfile(role)) return;

    const profile = collectProfile(role);

    try {
        const request = {
            username: username,
            password: password,
            role: role,
            name: profile.name,
            phone: profile.phone || '',
            college: profile.college || '',
            major: profile.major || '',
            className: profile.class || '',
            year: profile.year || '',
            empId: profile.adminId || profile.logisticsId || '',
            dept: profile.dept || '',
            position: profile.position || '',
            workplace: profile.workplace || ''
        };

        const result = await apiCall('/auth/register', 'POST', request);
        
        sessionStorage.removeItem('temp_username');
        sessionStorage.removeItem('temp_password');
        sessionStorage.removeItem('temp_role');

        document.getElementById('username').value = username;
        document.getElementById('password').value = password;
        document.getElementById('roleSelect').value = role;
        closeRegisterModal();
        showMessage('注册成功！请登录');
    } catch (error) {
        showMessage(error.message);
    }
}

async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('roleSelect').value;

    if (!username || !password) {
        showMessage('请输入账号和密码');
        return;
    }

    try {
        const result = await apiCall('/auth/login', 'POST', { username, password, role });
        const user = result.data;

        sessionStorage.setItem('current_user', JSON.stringify({
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            profile: user
        }));

        if (user.role === 'STUDENT') {
            location.href = '/student/notice.html';
        } else if (user.role === 'ADMIN') {
            location.href = '/admin/index.html';
        } else if (user.role === 'LOGISTICS') {
            location.href = '/logistics/index.html';
        }
    } catch (error) {
        showMessage(error.message);
    }
}

document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const modal = document.getElementById('registerModal');
        if (modal && modal.style.display === 'flex') return;
        handleLogin();
    }
});

function getCurrentUser() {
    const userStr = sessionStorage.getItem('current_user');
    if (userStr) return JSON.parse(userStr);
    return null;
}

function showMessage(msg) {
    alert(msg);
}
