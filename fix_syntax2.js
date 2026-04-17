const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Find the dead code block between populateProfileData and saveProfile
// It's the old loadProfileData code that's no longer in a function
const startMarker = `        fill('editPhone', user.phone);
        fill('editLocation', user.workplace);
        if (!result.success) {
            console.error('加载个人信息失败', result.message);
            return;
        }

        const user = result.data;

        const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.innerText = val || '-'; };
        setEl('profileUsername', user.username);
        setEl('profileName', user.name);
        setEl('profileDept', user.dept || user.college || '-');
        setEl('profileYear', user.year || '-');
        setEl('profilePhone', user.phone || '-');
        setEl('profileLocation', user.workplace || '-');

        const updatedUser = { ...currentUser, name: user.name };
        sessionStorage.setItem('current_user', JSON.stringify(updatedUser));

        const fill = (id, val) => { const e = document.getElementById(id); if (e) e.value = val || ''; };
        fill('editName', user.name);
        fill('editDept', user.dept || user.college);
        fill('editYear', user.year);
        fill('editPhone', user.phone);
        fill('editLocation', user.workplace);

    } catch (error) {
        console.error('加载个人信息失败:', error);
    }
}

async function saveProfile()`;

if (c.includes(startMarker)) {
    c = c.replace(startMarker, `        fill('editPhone', user.phone);
        fill('editLocation', user.workplace);
}

async function saveProfile()`);
    fs.writeFileSync(path, c, 'utf8');
    console.log('Fixed dead code');
} else {
    console.log('Start marker not found');
}
