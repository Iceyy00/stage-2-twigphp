/* app.js - Client-side app: auth and ticket CRUD using localStorage
   Session key: ticketapp_session
   Tickets key: ticketapp_tickets
   Users key: ticketapp_users
*/
(function(){
  const STORAGE_SESSION = 'ticketapp_session';
  const STORAGE_TICKETS = 'ticketapp_tickets';
  const STORAGE_USERS = 'ticketapp_users';
  const VALID_STATUSES = ['open','in_progress','closed'];

  function showToast(message,type='info'){
    const root = document.getElementById('toast-root');
    if(!root) return;
    const t = document.createElement('div');
    t.className = 'toast '+type;
    t.textContent = message;
    Object.assign(t.style,{background:'#111',color:'#fff',padding:'.6rem 1rem',borderRadius:'8px',margin:'.5rem',boxShadow:'0 6px 18px rgba(2,6,23,.2)'});
    root.appendChild(t);
    setTimeout(()=>{t.style.opacity=0;setTimeout(()=>t.remove(),400)},3000);
  }

  function ensureAuthenticatedRedirect(){
    const path = location.pathname;
    if(['/dashboard','/tickets'].includes(path)){
      const s = localStorage.getItem(STORAGE_SESSION);
      if(!s){
        showToast('Your session has expired — please log in again.','error');
        setTimeout(()=>location.href='/auth/login',700);
      }
    }
  }

  function logout(){
    localStorage.removeItem(STORAGE_SESSION);
    showToast('Logged out');
    setTimeout(()=>location.href='/',400);
  }

  // --- Auth helpers ---
  function initAuthForms(){
    const loginForm = document.getElementById('login-form');
    if(loginForm){
      loginForm.addEventListener('submit', function(e){
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        let ok = true;
        const emailErr = document.getElementById('email-error'); if(emailErr) emailErr.textContent='';
        const passErr = document.getElementById('password-error'); if(passErr) passErr.textContent='';
  if(!email){ if(emailErr) emailErr.textContent='Email is required'; ok=false }
  if(!password){ if(passErr) passErr.textContent='Password is required'; ok=false }
        if(!ok) return;

        // check users (defensive parse + sanitize to avoid malformed entries)
        let users = [];
        try {
          users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
          if(!Array.isArray(users)) users = [];
        } catch (e) { users = []; }
        // filter out invalid entries so we never call toLowerCase on undefined
        users = users.filter(u => u && typeof u.email === 'string' && typeof u.password === 'string');
        const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase() && u.password === password);
  if(!user){ showToast('Invalid credentials. Please try again.','error'); if(passErr) passErr.textContent='Invalid credentials'; return; }
        const token = 'tok_' + Math.random().toString(36).slice(2);
        localStorage.setItem(STORAGE_SESSION, JSON.stringify({token:token,user:{name:user.name,email:user.email}}));
        showToast('Welcome back, '+user.name+'!');
        setTimeout(()=>location.href='/dashboard',600);
      });
    }

    const signupForm = document.getElementById('signup-form');
    if(signupForm){
      signupForm.addEventListener('submit', function(e){
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        let ok = true;
        // clear errors defensively
        ['name','email','password'].forEach(id=>{ const el = document.getElementById(id+'-error'); if(el) el.textContent=''; });
        if(!name || name.length<2){ const ne = document.getElementById('name-error'); if(ne) ne.textContent='Please enter your full name'; ok=false}
        if(!email){ const ee = document.getElementById('email-error'); if(ee) ee.textContent='Email required'; ok=false}
        if(!password || password.length<6){ const pe = document.getElementById('password-error'); if(pe) pe.textContent='Password must be at least 6 characters'; ok=false}
        if(!ok) return;
        let users = [];
        try{
          users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
          if(!Array.isArray(users)) users = [];
        }catch(e){ users = []; }
        users = users.filter(u => u && typeof u.email === 'string' && typeof u.password === 'string');
        if(users.find(u=>u.email.toLowerCase()=== (email || '').toLowerCase())){ const ee = document.getElementById('email-error'); if(ee) ee.textContent='Account already exists'; showToast('Account already exists','error'); return }
        users.push({name:name,email:email,password:password});
        try{ localStorage.setItem(STORAGE_USERS, JSON.stringify(users)); }catch(e){ showToast('Failed to save account. Please check your browser settings.','error'); return }
        // Auto-login after signup for smoother flow
        const token = 'tok_' + Math.random().toString(36).slice(2);
        try{ localStorage.setItem(STORAGE_SESSION, JSON.stringify({token:token,user:{name:name,email:email}})); }catch(e){ /* ignore */ }
        showToast('Account created. Redirecting...');
        setTimeout(()=>location.href='/dashboard',700);
      });
    }
  }

  // --- Tickets ---
  function listTickets(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_TICKETS) || '[]');
    }catch(e){ showToast('Failed to load tickets. Please retry.','error'); return []; }
  }

  function saveTickets(tickets){
    localStorage.setItem(STORAGE_TICKETS, JSON.stringify(tickets));
  }

  function renderTicketsList(){
    const root = document.getElementById('tickets-list');
    if(!root) return;
    const tickets = listTickets();
    root.innerHTML='';
    if(tickets.length===0){ root.innerHTML = '<p class="muted">No tickets yet. Create one using the form.</p>'; return }
    tickets.slice().reverse().forEach(t=>{
      const el = document.createElement('div');
      el.className = 'ticket-card card';
      const statusClass = 'status-' + t.status;
      el.innerHTML = `
        <div class="ticket-meta">
          <strong>${escapeHtml(t.title)}</strong>
          <small class="muted">${new Date(t.createdAt).toLocaleString()}</small>
        </div>
        <div style="text-align:right">
          <div class="status-tag ${statusClass}">${statusLabel(t.status)}</div>
          <div style="margin-top:.5rem">
            <button class="btn btn-ghost btn-edit" data-id="${t.id}">Edit</button>
            <button class="btn btn-ghost btn-delete" data-id="${t.id}">Delete</button>
          </div>
        </div>
      `;
      root.appendChild(el);
    });

    // wire buttons
    root.querySelectorAll('.btn-edit').forEach(b=>b.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id; loadTicketIntoForm(id);
    }));
    root.querySelectorAll('.btn-delete').forEach(b=>b.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id; deleteTicket(id);
    }));
  }

  function statusLabel(s){ if(s==='open') return 'Open'; if(s==='in_progress') return 'In progress'; return 'Closed'; }

  function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m];}); }

  function loadTicketIntoForm(id){
    const tickets = listTickets();
    const t = tickets.find(x=>x.id===id);
    if(!t){ showToast('Ticket not found','error'); return }
    document.getElementById('ticket-id').value = t.id;
    document.getElementById('title').value = t.title;
    document.getElementById('description').value = t.description||'';
    document.getElementById('status').value = t.status;
    document.getElementById('priority').value = t.priority||'low';
  }

  function deleteTicket(id){
    if(!confirm('Delete this ticket? This action cannot be undone.')) return;
    let tickets = listTickets();
    const idx = tickets.findIndex(t=>t.id===id);
    if(idx===-1){ showToast('Ticket not found','error'); return }
    tickets.splice(idx,1);
    saveTickets(tickets);
    showToast('Ticket deleted');
    renderTicketsList();
    renderStats();
  }

  function initTicketsPage(){
    const form = document.getElementById('ticket-form');
    const resetBtn = document.getElementById('reset-btn');
    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        // validations
        ['title-error','status-error','description-error'].forEach(id=>{const el=document.getElementById(id); if(el) el.textContent='';});
        const title = document.getElementById('title').value.trim();
        const status = document.getElementById('status').value;
        const description = document.getElementById('description').value.trim();
        const priority = document.getElementById('priority').value;
        let ok=true;
        if(!title){document.getElementById('title-error').textContent='Title is required.'; ok=false}
        if(!VALID_STATUSES.includes(status)){document.getElementById('status-error').textContent='Select a valid status.'; ok=false}
        if(description && description.length>1000){document.getElementById('description-error').textContent='Description is too long.'; ok=false}
        if(!ok) return;
        const idField = document.getElementById('ticket-id').value;
        let tickets = listTickets();
        if(idField){
          const idx = tickets.findIndex(t=>t.id===idField);
          if(idx===-1){ showToast('Failed to update: ticket not found','error'); return }
          tickets[idx] = Object.assign({}, tickets[idx], {title,description,status,priority,updatedAt: new Date().toISOString()});
          saveTickets(tickets);
          showToast('Ticket updated');
        } else {
          const newTicket = {id: 't_' + Math.random().toString(36).slice(2), title, description, status, priority, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()};
          tickets.push(newTicket);
          saveTickets(tickets);
          showToast('Ticket created');
        }
        form.reset();
        renderTicketsList();
        renderStats();
      });
      resetBtn.addEventListener('click', ()=>{form.reset(); document.getElementById('ticket-id').value='';});
    }
    renderTicketsList();
  }

  function renderStats(){
    const tickets = listTickets();
    const total = tickets.length;
    const open = tickets.filter(t=>t.status==='open').length;
    const closed = tickets.filter(t=>t.status==='closed').length;
    const elTotal = document.getElementById('stat-total'); if(elTotal) elTotal.textContent = total;
    const elOpen = document.getElementById('stat-open'); if(elOpen) elOpen.textContent = open;
    const elClosed = document.getElementById('stat-closed'); if(elClosed) elClosed.textContent = closed;
  }

  // initialize
  document.addEventListener('DOMContentLoaded', function(){
    initAuthForms();
    // make sure landing page buttons also can work
    // expose App methods
  });

  window.App = {
    ensureAuthenticatedRedirect, logout, initTicketsPage, renderTicketsList, renderStats
  };
})();
