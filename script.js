

let currentUser = null;
let attendanceData = { students: {}, classInfo: null };

// Initialize user database
function initUserDatabase() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { id: "ADM-001", password: "admin123", role: "admin", name: "System Admin" },
            { id: "TCH-101", password: "teacher123", role: "teacher", name: "Mr. Abebe Kebede", grade: "Grade 9", subject: "Mathematics", section: "A" },
            { id: "TCH-102", password: "teacher123", role: "teacher", name: "Ms. Almaz Tesfaye", grade: "Grade 10", subject: "English", section: "B" },
            { id: "CLN-201", password: "clinic123", role: "clinic", name: "Nurse Mekdes Alemu" },
            { id: "PSY-301", password: "psych123", role: "psychiatrist", name: "Dr. Tesfaye Bekele" },
            { id: "DIR-401", password: "director123", role: "director", name: "Dr. Amanuel Girma" },
            { id: "GRD-501", password: "guard123", role: "guard", name: "Guard Solomon Desta" }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem('directorAlerts')) {
        localStorage.setItem('directorAlerts', JSON.stringify([]));
    }
    if (!localStorage.getItem('psychNotes')) {
        localStorage.setItem('psychNotes', JSON.stringify([]));
    }
}

// LOGIN FUNCTION
function login() {
    const userId = document.getElementById('user-id').value.trim();
    const password = document.getElementById('password').value;
    const selectedRoleBtn = document.querySelector('.role-btn.selected');
    const selectedRole = selectedRoleBtn ? selectedRoleBtn.querySelector('span').textContent.toLowerCase() : null;
    
    if (!userId || !password) {
        alert('Please enter both User ID and Password');
        return;
    }
    
    if (!selectedRole) {
        alert('Please select your role');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId && u.password === password);
    
    if (!user) {
        alert('❌ Invalid User ID or Password');
        return;
    }
    
    if (selectedRole !== user.role) {
        alert(`⚠️ This ID is for ${user.role.toUpperCase()} role. Please select ${user.role.toUpperCase()}`);
        return;
    }
    
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    document.getElementById('current-role').innerHTML = `<i class="fas fa-check-circle"></i> ${user.role.toUpperCase()} | ${user.name}`;
    
    const headerRight = document.querySelector('.current-user');
    if (headerRight && !document.getElementById('logout-link')) {
        const logoutSpan = document.createElement('span');
        logoutSpan.id = 'logout-link';
        logoutSpan.innerHTML = ' | <a href="#" onclick="logout()" style="color:#dc3545; text-decoration:none;">Logout</a>';
        headerRight.appendChild(logoutSpan);
    }
    
    showPage(`${user.role}-dashboard`);
    
    if (user.role === 'teacher') loadTeacherData(user);
    if (user.role === 'director') { updateDirectorBadge(); loadDirectorAlerts(); }
    if (user.role === 'clinic') loadClinicAbsences();
    if (user.role === 'psychiatrist') loadPsychReferrals();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('current-role').innerHTML = 'Not logged in';
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) logoutLink.remove();
    showPage('home');
}

function loadTeacherData(teacher) {
    const gradeSelect = document.getElementById('teacher-grade');
    const sectionSelect = document.getElementById('teacher-section');
    if (gradeSelect && teacher.grade) gradeSelect.value = teacher.grade;
    if (sectionSelect && teacher.section) sectionSelect.value = teacher.section;
}

window.showPage = function(pageId) {
    if (pageId.includes('dashboard') && !currentUser) {
        alert('Please login first');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('login').classList.add('active');
        return;
    }
    
    if (pageId.includes('dashboard') && currentUser) {
        const expectedRole = pageId.replace('-dashboard', '');
        if (currentUser.role !== expectedRole) {
            alert(`❌ Access Denied! You are ${currentUser.role.toUpperCase()}. This is for ${expectedRole.toUpperCase()}.`);
            return;
        }
    }
    
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    
    if (pageId === 'admin-dashboard') showAdminSection('grades');
    if (pageId === 'teacher-dashboard') showTeacherSection('attendance');
    if (pageId === 'director-dashboard') showDirectorSection('overview');
    if (pageId === 'clinic-dashboard') loadClinicAbsences();
    if (pageId === 'psychiatrist-dashboard') loadPsychReferrals();
    
    setTimeout(makeTablesResponsive, 100);
};

function selectRole(role) {
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

function showAdminSection(section) {
    document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
    const target = document.getElementById(`admin-${section}`);
    if (target) target.style.display = 'block';
    document.querySelectorAll('.sidebar-nav a').forEach(link => link.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    if (section === 'users') loadUserList();
    if (section === 'students') loadStudents();
}

function showTeacherSection(section) {
    const attendanceDiv = document.getElementById('teacher-attendance');
    const reportDiv = document.getElementById('teacher-submit-director');
    if (attendanceDiv) attendanceDiv.style.display = section === 'attendance' ? 'block' : 'none';
    if (reportDiv) reportDiv.style.display = section === 'submit-director' ? 'block' : 'none';
    document.querySelectorAll('.sidebar-nav a').forEach(link => link.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
}

function showDirectorSection(section) {
    const overviewDiv = document.getElementById('director-overview');
    const attendanceDiv = document.getElementById('director-attendance');
    const reportsDiv = document.getElementById('director-reports');
    if (overviewDiv) overviewDiv.style.display = section === 'overview' ? 'block' : 'none';
    if (attendanceDiv) attendanceDiv.style.display = section === 'attendance' ? 'block' : 'none';
    if (reportsDiv) reportsDiv.style.display = section === 'reports' ? 'block' : 'none';
    document.querySelectorAll('.sidebar-nav a').forEach(link => link.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    if (section === 'reports') loadDirectorAlerts();
}

// STUDENT DATA
function loadStudents() {
    const students = [
        { id: 'S1001', name: 'Abebe Bikila', grade: 'Grade 9', section: 'A', phone: '+251 92 345 6789' },
        { id: 'S1002', name: 'Mekdes Haile', grade: 'Grade 9', section: 'A', phone: '+251 91 234 5678' },
        { id: 'S1003', name: 'Tesfaye Bekele', grade: 'Grade 9', section: 'A', phone: '+251 93 123 4567' },
        { id: 'S1004', name: 'Samuel Getachew', grade: 'Grade 9', section: 'B', phone: '+251 94 234 5678' },
        { id: 'S1005', name: 'Hana Solomon', grade: 'Grade 9', section: 'B', phone: '+251 95 345 6789' },
        { id: 'S1006', name: 'Yonas Desta', grade: 'Grade 9', section: 'C', phone: '+251 96 456 7890' },
        { id: 'S1007', name: 'Eden Worku', grade: 'Grade 10', section: 'A', phone: '+251 97 567 8901' },
        { id: 'S1008', name: 'Biruk Ayele', grade: 'Grade 10', section: 'A', phone: '+251 98 678 9012' },
        { id: 'S1009', name: 'Liya Tsegaye', grade: 'Grade 10', section: 'B', phone: '+251 99 789 0123' },
        { id: 'S1010', name: 'Nahom Tadesse', grade: 'Grade 10', section: 'B', phone: '+251 91 111 2222' },
        { id: 'S1011', name: 'Bethel Alemu', grade: 'Grade 11', section: 'A', phone: '+251 92 222 3333' },
        { id: 'S1012', name: 'Dawit Girma', grade: 'Grade 11', section: 'A', phone: '+251 93 333 4444' },
        { id: 'S1013', name: 'Selam Tesfaye', grade: 'Grade 11', section: 'B', phone: '+251 94 444 5555' },
        { id: 'S1014', name: 'Henok Assefa', grade: 'Grade 12', section: 'A', phone: '+251 95 555 6666' },
        { id: 'S1015', name: 'Ruth Mekonnen', grade: 'Grade 12', section: 'A', phone: '+251 96 666 7777' }
    ];
    
    const tbody = document.getElementById('student-tbody');
    if (tbody) {
        tbody.innerHTML = students.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.grade}</td><td>${s.section}</td><td>${s.phone}</td></tr>`).join('');
    }
    window.allStudents = students;
}

function filterStudents() {
    const grade = document.getElementById('filter-grade')?.value;
    const students = window.allStudents || [];
    const filtered = grade === 'all' ? students : students.filter(s => s.grade === grade);
    const tbody = document.getElementById('student-tbody');
    if (tbody) {
        tbody.innerHTML = filtered.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.grade}</td><td>${s.section}</td><td>${s.phone}</td></tr>`).join('');
    }
}

// TEACHER FUNCTIONS
function loadStudentList() {
    const grade = document.getElementById('teacher-grade').value;
    const section = document.getElementById('teacher-section').value;
    const period = document.getElementById('teacher-period').value;
    const subject = document.getElementById('teacher-subject').value;
    
    if (!grade || !section || !period || !subject) {
        alert('Please select all options');
        return;
    }
    
    const students = window.allStudents?.filter(s => s.grade === grade && s.section === section) || [];
    if (students.length === 0) {
        alert('No students found');
        return;
    }
    
    attendanceData.classInfo = { grade, section, period, subject, teacher: currentUser?.name || 'Teacher' };
    
    const container = document.getElementById('teacher-student-list');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = `
        <h3>📋 Grade ${grade} - Section ${section} - ${period} (${subject})</h3>
        ${students.map((s, i) => `
            <div class="student-item">
                <div>${i+1}</div>
                <div class="student-info"><strong>${s.name}</strong><small>ID: ${s.id}</small><div class="student-phone"><i class="fas fa-phone"></i> ${s.phone}</div></div>
                <div class="attendance-options">
                    <div class="attendance-btn present" onclick="markAttendance(this, 'present', '${s.name}')">Present</div>
                    <div class="attendance-btn absent" onclick="markAttendance(this, 'absent', '${s.name}')">Absent</div>
                    <div class="attendance-btn late" onclick="markAttendance(this, 'late', '${s.name}')">Late</div>
                </div>
                <div><div class="call-student" onclick="callStudent('${s.name}', '${s.phone}')"><i class="fas fa-phone"></i> Call</div></div>
            </div>
        `).join('')}
        <div style="text-align:center; margin-top:30px"><button class="btn btn-success" onclick="submitAttendance()">Submit Attendance</button></div>
    `;
}

function markAttendance(btn, status, studentName) {
    btn.parentElement.querySelectorAll('.attendance-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (!attendanceData.students) attendanceData.students = {};
    attendanceData.students[studentName] = status;
}

function submitAttendance() {
    if (!attendanceData.students || Object.keys(attendanceData.students).length === 0) {
        alert('Please mark attendance');
        return;
    }
    
    const absent = Object.entries(attendanceData.students).filter(([_, s]) => s === 'absent');
    const present = Object.entries(attendanceData.students).filter(([_, s]) => s === 'present');
    const late = Object.entries(attendanceData.students).filter(([_, s]) => s === 'late');
    
    if (absent.length > 0) sendAbsentToDirector(absent);
    
    alert(`✅ Submitted!\nPresent: ${present.length}\nAbsent: ${absent.length}\nLate: ${late.length}`);
    attendanceData.students = {};
}

function sendAbsentToDirector(absentStudents) {
    const alerts = JSON.parse(localStorage.getItem('directorAlerts') || '[]');
    alerts.push({
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        teacher: attendanceData.classInfo?.teacher || currentUser?.name || 'Teacher',
        grade: attendanceData.classInfo?.grade,
        section: attendanceData.classInfo?.section,
        period: attendanceData.classInfo?.period,
        subject: attendanceData.classInfo?.subject,
        students: absentStudents.map(([name]) => name),
        status: 'unreviewed'
    });
    localStorage.setItem('directorAlerts', JSON.stringify(alerts));
    updateDirectorBadge();
    if (document.getElementById('clinic-absences-list')) loadClinicAbsences();
}

function callStudent(name, phone) {
    alert(`📞 Calling ${name} at ${phone}`);
}

// ADMIN USER MANAGEMENT
function createNewUser() {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('❌ Only Admin can create accounts.');
        return;
    }
    
    const role = document.getElementById('new-user-role')?.value;
    const name = document.getElementById('new-user-name')?.value;
    const grade = document.getElementById('new-user-grade')?.value;
    const subject = document.getElementById('new-user-subject')?.value;
    const section = document.getElementById('new-user-section')?.value;
    
    if (!role || !name) {
        alert('Please fill: Role and Name');
        return;
    }
    
    let idPrefix = '';
    switch(role) {
        case 'teacher': idPrefix = 'TCH'; break;
        case 'clinic': idPrefix = 'CLN'; break;
        case 'psychiatrist': idPrefix = 'PSY'; break;
        case 'director': idPrefix = 'DIR'; break;
        case 'guard': idPrefix = 'GRD'; break;
        default: idPrefix = 'USR';
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const existingIds = users.filter(u => u.id.startsWith(idPrefix)).map(u => parseInt(u.id.split('-')[1]));
    let nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 100;
    
    const newId = `${idPrefix}-${nextNum}`;
    const defaultPassword = `${role}123`;
    
    const newUser = { id: newId, password: defaultPassword, role: role, name: name };
    if (role === 'teacher') {
        newUser.grade = grade || 'Not Assigned';
        newUser.subject = subject || 'Not Assigned';
        newUser.section = section || 'Not Assigned';
    }
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    alert(`✅ Created!\nID: ${newId}\nPassword: ${defaultPassword}`);
    document.getElementById('new-user-name').value = '';
    loadUserList();
}

function toggleTeacherFields() {
    const role = document.getElementById('new-user-role')?.value;
    const fields = document.getElementById('teacher-fields');
    if (fields) fields.style.display = role === 'teacher' ? 'block' : 'none';
}

function loadUserList() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const tbody = document.getElementById('user-list-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = users.map(user => `
          <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td><span class="status-badge">${user.role.toUpperCase()}</span></td>
            <td>${user.grade || '-'}</td>
            <td>${user.subject || '-'}</td>
            <td>
                <button class="btn btn-sm" onclick="resetUserPassword('${user.id}')">Reset</button>
                ${user.role !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">Del</button>` : ''}
            </td>
          </tr>
    `).join('');
}

function resetUserPassword(userId) {
    if (!currentUser || currentUser.role !== 'admin') return;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    if (user) {
        user.password = `${user.role}123`;
        localStorage.setItem('users', JSON.stringify(users));
        alert(`Password reset for ${userId}\nNew: ${user.role}123`);
    }
}

function deleteUser(userId) {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (confirm(`Delete ${userId}?`)) {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        users = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(users));
        loadUserList();
    }
}

// DIRECTOR FUNCTIONS - MATCHES YOUR SCREENSHOT
function updateDirectorBadge() {
    const alerts = JSON.parse(localStorage.getItem('directorAlerts') || '[]');
    const count = alerts.filter(a => a.status === 'unreviewed').length;
    const badge = document.getElementById('director-alert-count');
    if (badge) badge.textContent = count;
}

function loadDirectorAlerts() {
    const container = document.getElementById('director-alerts-container');
    if (!container) return;
    const alerts = JSON.parse(localStorage.getItem('directorAlerts') || '[]');
    
    if (alerts.length === 0) {
        container.innerHTML = '<div class="notification info">No reports yet.</div>';
        return;
    }
    
    container.innerHTML = alerts.map(alert => `
        <div style="margin-bottom:20px; border-left:4px solid var(--warning-orange); background:white; padding:20px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:10px;">
                <strong style="font-size:1.1rem;">Absence Alert - Grade ${alert.grade}${alert.section || ''}</strong>
                <span class="status-badge ${alert.status === 'unreviewed' ? 'status-unverified' : 'status-verified'}">${alert.status === 'unreviewed' ? 'New' : 'Reviewed'}</span>
            </div>
            <div style="color:var(--dark-gray); margin-bottom:15px;">
                <small>Submitted: ${alert.date} ${alert.time}</small><br>
                <small>By: ${alert.teacher}</small><br>
                <small>Period: ${alert.period} | Subject: ${alert.subject}</small>
            </div>
            <div style="margin-top:10px;">
                <strong>Absent Students (${alert.students.length}):</strong>
                <div style="margin-top:8px;">
                    ${alert.students.map((student, idx) => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
                            <div><strong>${idx+1}. ${student}</strong><br><small>ID: S${1000 + idx}</small></div>
                            <div><small>${alert.subject}</small></div>
                            <button class="btn btn-sm btn-warning" onclick="exportStudentReport('${student}')">Export Report</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div style="margin-top:15px; display:flex; gap:10px;">
                <button class="btn btn-sm btn-success" onclick="markAlertReviewed(${alert.id})">Mark as Reviewed</button>
                <button class="btn btn-sm btn-primary" onclick="callTeacher('${alert.teacher}')">Contact Teacher</button>
                <button class="btn btn-sm btn-warning" onclick="exportFullReport(${alert.id})">Export Report</button>
            </div>
        </div>
    `).join('');
}

function markAlertReviewed(id) {
    let alerts = JSON.parse(localStorage.getItem('directorAlerts') || '[]');
    alerts = alerts.map(a => a.id === id ? { ...a, status: 'reviewed' } : a);
    localStorage.setItem('directorAlerts', JSON.stringify(alerts));
    updateDirectorBadge();
    loadDirectorAlerts();
}

function callTeacher(teacherName) {
    alert(`📞 Calling teacher ${teacherName}...`);
}

function exportStudentReport(studentName) {
    alert(`📄 Exporting report for ${studentName}...`);
}

function exportFullReport(alertId) {
    alert(`📊 Full report exported for alert ${alertId}`);
}

function submitDirectorReport() {
    const title = document.getElementById('report-title')?.value;
    const grade = document.getElementById('report-grade-select')?.value;
    const details = document.getElementById('report-details')?.value;
    if (!title || !grade || !details) {
        alert('Fill all fields');
        return;
    }
    alert(`✅ Report sent to Director`);
    if (document.getElementById('report-title')) document.getElementById('report-title').value = '';
    if (document.getElementById('report-details')) document.getElementById('report-details').value = '';
}

// CLINIC FUNCTIONS
function loadClinicAbsences() {
    const container = document.getElementById('clinic-absences-list');
    if (!container) return;
    const alerts = JSON.parse(localStorage.getItem('directorAlerts') || '[]');
    const unverified = alerts.filter(a => a.status === 'unreviewed');
    
    if (unverified.length === 0) {
        container.innerHTML = '<div class="notification success">✅ No unverified absences.</div>';
        return;
    }
    
    container.innerHTML = unverified.map(a => `
        <div class="card" style="margin-bottom:15px">
            <p><strong>📅 ${a.date}</strong> | Grade ${a.grade} ${a.section || ''} | Period ${a.period}</p>
            <p><strong>Students:</strong> ${a.students.join(', ')}</p>
            <p><strong>Teacher:</strong> ${a.teacher}</p>
            <select id="reason-${a.id}" class="form-control" style="width:200px; display:inline-block; margin:10px 10px 10px 0">
                <option>Fever</option><option>Headache</option><option>Injury</option><option>Stomach Issue</option><option>Other</option>
            </select>
            <button class="btn btn-success" onclick="verifyClinicAbsence(${a.id})">✅ Verify Medical</button>
        </div>
    `).join('');
}

function verifyClinicAbsence(id) {
    let alerts = JSON.parse(localStorage.getItem('directorAlerts') || '[]');
    const reasonSelect = document.getElementById(`reason-${id}`);
    const reason = reasonSelect ? reasonSelect.value : 'Medical';
    alerts = alerts.map(a => a.id === id ? { ...a, status: 'verified', medicalReason: reason } : a);
    localStorage.setItem('directorAlerts', JSON.stringify(alerts));
    updateDirectorBadge();
    loadClinicAbsences();
    alert(`✅ Verified as medical (${reason})`);
}

// PSYCHIATRIST FUNCTIONS - WITH ADD NOTES BUTTON
function loadPsychReferrals() {
    const container = document.getElementById('psych-referrals');
    if (!container) return;
    const psychNotes = JSON.parse(localStorage.getItem('psychNotes') || '[]');
    
    container.innerHTML = `
        <div class="card">
            <h3>🔒 Confidential Referrals</h3>
            <div style="overflow-x:auto">
                <table style="width:100%">
                    <thead> <tr><th>Student ID</th><th>Referral Date</th><th>Notes</th><th>Action</th></tr> </thead>
                    <tbody>
                        <tr>
                            <td>CONF-001</td>
                            <td>${new Date().toLocaleDateString()}</td>
                            <td><textarea id="notes-1" class="form-control" rows="2" placeholder="Add confidential notes...">${psychNotes.find(n => n.id === 'CONF-001')?.notes || ''}</textarea></td>
                            <td><button class="btn btn-sm btn-primary" onclick="savePsychNote('CONF-001')">Add Notes</button></td>
                        </tr>
                        <tr>
                            <td>CONF-002</td>
                            <td>${new Date().toLocaleDateString()}</td>
                            <td><textarea id="notes-2" class="form-control" rows="2" placeholder="Add confidential notes...">${psychNotes.find(n => n.id === 'CONF-002')?.notes || ''}</textarea></td>
                            <td><button class="btn btn-sm btn-primary" onclick="savePsychNote('CONF-002')">Add Notes</button></td>
                        </tr>
                        <tr>
                            <td>CONF-003</td>
                            <td>${new Date().toLocaleDateString()}</td>
                            <td><textarea id="notes-3" class="form-control" rows="2" placeholder="Add confidential notes...">${psychNotes.find(n => n.id === 'CONF-003')?.notes || ''}</textarea></td>
                            <td><button class="btn btn-sm btn-primary" onclick="savePsychNote('CONF-003')">Add Notes</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="notification info" style="margin-top:15px"><i class="fas fa-lock"></i> <div>These records are strictly confidential. Only psychiatrist has access.</div></div>
        </div>
    `;
}

function savePsychNote(studentId) {
    const noteId = studentId === 'CONF-001' ? 'notes-1' : studentId === 'CONF-002' ? 'notes-2' : 'notes-3';
    const noteText = document.getElementById(noteId)?.value;
    if (!noteText) {
        alert('Please enter notes before saving');
        return;
    }
    let psychNotes = JSON.parse(localStorage.getItem('psychNotes') || '[]');
    const existingIndex = psychNotes.findIndex(n => n.id === studentId);
    if (existingIndex >= 0) {
        psychNotes[existingIndex].notes = noteText;
        psychNotes[existingIndex].updatedAt = new Date().toLocaleString();
    } else {
        psychNotes.push({ id: studentId, notes: noteText, createdAt: new Date().toLocaleString() });
    }
    localStorage.setItem('psychNotes', JSON.stringify(psychNotes));
    alert(`✅ Notes saved for ${studentId}`);
}

// GUARD FUNCTIONS
function checkPermission() {
    const student = document.getElementById('guard-student')?.value;
    if (!student) {
        alert('Enter student name or ID');
        return;
    }
    const resultDiv = document.getElementById('permission-result');
    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `<i class="fas fa-check-circle"></i><div><strong>✅ Permission Approved</strong><br>Student "${student}" has valid permission to exit.</div>`;
    }
}

function submitRequest() {
    const name = document.getElementById('service-name')?.value;
    if (!name) {
        alert('Enter your name');
        return;
    }
    alert(`✅ Request submitted! ${name}, you will receive SMS confirmation.`);
    if (document.getElementById('service-name')) document.getElementById('service-name').value = '';
}

// UTILITIES
function makeTablesResponsive() {
    document.querySelectorAll('table').forEach(table => {
        if (!table.parentElement.hasAttribute('data-wrapped')) {
            const wrapper = document.createElement('div');
            wrapper.style.overflowX = 'auto';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
            wrapper.setAttribute('data-wrapped', 'true');
        }
    });
}

// INITIALIZE
document.addEventListener('DOMContentLoaded', function() {
    initUserDatabase();
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('current-role').innerHTML = `<i class="fas fa-check-circle"></i> ${currentUser.role.toUpperCase()} | ${currentUser.name}`;
        const headerRight = document.querySelector('.current-user');
        if (headerRight && !document.getElementById('logout-link')) {
            const logoutSpan = document.createElement('span');
            logoutSpan.id = 'logout-link';
            logoutSpan.innerHTML = ' | <a href="#" onclick="logout()" style="color:#dc3545; text-decoration:none;">Logout</a>';
            headerRight.appendChild(logoutSpan);
        }
    }
    
    loadStudents();
    updateDirectorBadge();
    makeTablesResponsive();
    loadClinicAbsences();
    loadPsychReferrals();
});
