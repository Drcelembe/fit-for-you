// FIT FOR YOU — Single JS for all pages

(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  document.addEventListener('DOMContentLoaded', () => {
    // Global: year + nav toggle + active state
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const navToggle = $('.nav-toggle');
    const navLinks = $('.nav-links');
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    }

    // Route
    const page = document.body.dataset.page;
    if (page === 'classes') initClassesPage();
    if (page === 'booking') initBookingPage();
    if (page === 'contact') initContactPage();
  });

  // ---------- Classes Page ----------
  function initClassesPage() {
    const classGrid = $('#class-grid');
    const filterDay = $('#filter-day');
    const filterType = $('#filter-type');
    const search = $('#search-class');

    // Mock schedule (frontend-only)
    const classes = [
      { id: 'c1', name: 'Strength Foundations', type: 'Strength', coach: 'Lerato', day: 'Monday',  time: '06:30' },
      { id: 'c2', name: 'HIIT Engine',          type: 'HIIT',     coach: 'Thabo',   day: 'Monday',  time: '17:00' },
      { id: 'c3', name: 'Mobility Rx',          type: 'Mobility', coach: 'Aisha',   day: 'Tuesday', time: '06:30' },
      { id: 'c4', name: 'Conditioning Blitz',   type: 'Conditioning', coach: 'Neo', day: 'Wednesday', time: '18:00' },
      { id: 'c5', name: 'Strength Progression', type: 'Strength', coach: 'Lerato', day: 'Thursday', time: '08:00' },
      { id: 'c6', name: 'HIIT Sprint',          type: 'HIIT',     coach: 'Thabo',   day: 'Friday',  time: '12:00' },
      { id: 'c7', name: 'Mobility Flow',        type: 'Mobility', coach: 'Aisha',   day: 'Saturday', time: '08:00' },
      { id: 'c8', name: 'Engine Builder',       type: 'Conditioning', coach: 'Neo', day: 'Sunday', time: '08:00' },
    ];

    function render() {
      const d = (filterDay?.value || 'all').toLowerCase();
      const t = (filterType?.value || 'all').toLowerCase();
      const q = (search?.value || '').toLowerCase();

      const filtered = classes.filter(c => {
        const dayOk = d === 'all' || c.day.toLowerCase() === d;
        const typeOk = t === 'all' || c.type.toLowerCase() === t;
        const qOk = !q || [c.name, c.coach, c.type].join(' ').toLowerCase().includes(q);
        return dayOk && typeOk && qOk;
      });

      classGrid.innerHTML = filtered.map(c => `
        <article class="card class-card" data-id="${c.id}" data-name="${c.name}" data-coach="${c.coach}" data-day="${c.day}" data-time="${c.time}">
          <h3>${c.name}</h3>
          <p><strong>${c.type}</strong> • ${c.day} @ ${c.time}</p>
          <p>Coach: ${c.coach}</p>
          <button class="btn btn-cta book-btn">Book</button>
        </article>
      `).join('');
    }

    render();
    [filterDay, filterType, search].forEach(el => el && el.addEventListener('input', render));

    // Delegate booking clicks
    classGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.book-btn');
      if (!btn) return;
      const card = e.target.closest('.class-card');
      const payload = {
        id: card.dataset.id,
        name: card.dataset.name,
        coach: card.dataset.coach,
        day: card.dataset.day,
        time: card.dataset.time
      };
      localStorage.setItem('pendingBooking', JSON.stringify(payload));
      // Also pass via query for robustness
      const params = new URLSearchParams(payload).toString();
      window.location.href = `booking.html?${params}`;
    });
  }

  // ---------- Booking Page ----------
  function initBookingPage() {
    const selName = $('#sel-name');
    const selCoach = $('#sel-coach');
    const selDay = $('#sel-day');
    const selTime = $('#sel-time');
    const changeBtn = $('#change-class');
    const form = $('#booking-form');
    const overlay = $('#confirm-overlay');
    const confirmText = $('#confirm-text');
    const dateInput = $('#date');
    const timeSlot = $('#timeSlot');

    // Prefill min date = today
    if (dateInput) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth()+1).padStart(2,'0');
      const dd = String(today.getDate()).padStart(2,'0');
      dateInput.min = `${yyyy}-${mm}-${dd}`;
    }

    // Read from query or localStorage
    const params = Object.fromEntries(new URLSearchParams(location.search));
    let selected = null;

    if (params.name && params.coach) {
      selected = params;
    } else {
      try { selected = JSON.parse(localStorage.getItem('pendingBooking')); } catch {}
    }

    if (!selected) {
      // Fallback UI: indicate not selected
      selName.textContent = 'Select a class';
      selCoach.textContent = '—';
      selDay.textContent = '—';
      selTime.textContent = '—';
    } else {
      selName.textContent = selected.name;
      selCoach.textContent = selected.coach;
      selDay.textContent = selected.day;
      selTime.textContent = selected.time;
      // Suggest picked slot
      if (timeSlot && selected.time) {
        const opt = Array.from(timeSlot.options).find(o => o.value === selected.time);
        if (opt) timeSlot.value = selected.time;
      }
    }

    changeBtn?.addEventListener('click', () => window.location.href = 'classes.html');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Validate
      const fullName = $('#fullName').value.trim();
      const email = $('#email').value.trim();
      const phone = $('#phone').value.trim();
      const membership = $('#membership').value;
      const date = $('#date').value;
      const time = $('#timeSlot').value;

      if (!selected || !selected.name) {
        alert('Select a class before booking.');
        return;
      }
      if (!fullName || !email || !membership || !date || !time) {
        alert('Complete all required fields.');
        return;
      }
      // Basic future-date check
      const picked = new Date(date + 'T' + (time || '00:00'));
      const now = new Date();
      if (picked < now) {
        alert('Pick a future date/time.');
        return;
      }

      // Persist to localStorage
      const booking = {
        id: 'BKG-' + Date.now(),
        classId: selected.id || null,
        className: selected.name,
        coach: selected.coach,
        day: selected.day,
        time,
        date,
        fullName,
        email,
        phone,
        membership,
        createdAt: new Date().toISOString()
      };
      const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      bookings.push(booking);
      localStorage.setItem('bookings', JSON.stringify(bookings));

      // Confirmation
      confirmText.textContent = `${booking.fullName}, you’re locked in for "${booking.className}" with ${booking.coach} on ${booking.date} at ${booking.time}. Booking ID: ${booking.id}.`;
      overlay.classList.remove('hidden');
      // Clear one-time selection
      localStorage.removeItem('pendingBooking');
      form.reset();
    });
  }

  // ---------- Contact Page ----------
  function initContactPage() {
    const form = $('#contact-form');
    const success = $('#contact-success');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      success.classList.remove('hidden');
      form.reset();
    });
  }
})();
