/*
 * Pregnancy Journey Tracker — component logic
 * Requires weeks-data.js (PREGNANCY_WEEKS) to be loaded first.
 * Everything is scoped to elements inside #pregnancy-tracker.
 */
(function () {
  'use strict';

  var TOTAL_WEEKS = 42;
  var root = document.getElementById('pregnancy-tracker');
  if (!root || typeof PREGNANCY_WEEKS === 'undefined') return;

  var weekByNumber = {};
  PREGNANCY_WEEKS.forEach(function (w) { weekByNumber[w.week] = w; });

  var state = { week: 21 };

  var els = {
    prev: document.getElementById('pt-prev'),
    next: document.getElementById('pt-next'),
    prevBottom: document.getElementById('pt-prev-bottom'),
    nextBottom: document.getElementById('pt-next-bottom'),
    weekCurrent: document.getElementById('pt-week-current'),
    bottomWeek: document.getElementById('pt-bottom-week'),
    trimesterPills: root.querySelectorAll('.pt-trimester-pill'),
    progressText: document.getElementById('pt-progress-text'),
    progressPercent: document.getElementById('pt-progress-percent'),
    progressFill: document.getElementById('pt-progress-fill'),
    progressTrack: document.getElementById('pt-progress-track'),
    timeline: document.getElementById('pt-timeline'),
    illustration: document.getElementById('pt-illustration'),
    captionWeek: document.getElementById('pt-caption-week'),
    sizeLength: document.getElementById('pt-size-length'),
    sizeWeight: document.getElementById('pt-size-weight'),
    sizeComparison: document.getElementById('pt-size-comparison'),
    overviewBadge: document.getElementById('pt-overview-badge'),
    headline: document.getElementById('pt-headline'),
    summary: document.getElementById('pt-summary'),
    changesList: document.getElementById('pt-changes-list'),
    devCard: document.getElementById('pt-dev-card'),
    devGrid: document.getElementById('pt-dev-grid'),
    statusWord: document.getElementById('pt-status-word'),
    statusText: document.getElementById('pt-status-text'),
    milestoneTitle: document.getElementById('pt-milestone-title'),
    milestoneText: document.getElementById('pt-milestone-text')
  };

  var TRIMESTER_GROUPS = [
    { label: 'First Trimester', name: 'First Trimester', from: 1, to: 12 },
    { label: 'Second Trimester', name: 'Second Trimester', from: 13, to: 27 },
    { label: 'Third Trimester', name: 'Third Trimester', from: 28, to: 42 }
  ];

  function buildTimeline() {
    var frag = document.createDocumentFragment();
    TRIMESTER_GROUPS.forEach(function (group) {
      var groupEl = document.createElement('div');
      groupEl.className = 'pt-timeline-group';

      var label = document.createElement('span');
      label.className = 'pt-timeline-group-label';
      label.textContent = group.label.toUpperCase();
      groupEl.appendChild(label);

      var weeksEl = document.createElement('div');
      weeksEl.className = 'pt-timeline-weeks';

      for (var w = group.from; w <= group.to; w++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pt-week-dot';
        btn.textContent = w;
        btn.setAttribute('data-week', w);
        btn.setAttribute('role', 'option');
        btn.setAttribute('aria-label', 'Week ' + w);
        btn.addEventListener('click', function () {
          setWeek(parseInt(this.getAttribute('data-week'), 10));
        });
        weeksEl.appendChild(btn);
      }

      groupEl.appendChild(weeksEl);
      frag.appendChild(groupEl);
    });
    els.timeline.appendChild(frag);
  }

  function refreshTimelineStates() {
    var dots = root.querySelectorAll('.pt-week-dot');
    dots.forEach(function (dot) {
      var w = parseInt(dot.getAttribute('data-week'), 10);
      dot.classList.remove('is-current', 'is-past');
      if (w === state.week) {
        dot.classList.add('is-current');
        dot.setAttribute('aria-selected', 'true');
      } else {
        dot.setAttribute('aria-selected', 'false');
        if (w < state.week) dot.classList.add('is-past');
      }
    });
  }

  function scrollTimelineToCurrent() {
    var current = root.querySelector('.pt-week-dot.is-current');
    if (current && current.scrollIntoView) {
      current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  function fadeSwap(el, updateFn) {
    if (!el) { updateFn(); return; }
    el.classList.add('pt-fade');
    updateFn();
    // restart animation
    void el.offsetWidth;
    el.classList.remove('pt-fade');
    void el.offsetWidth;
    el.classList.add('pt-fade');
  }

  function renderDevelopment(data) {
    els.devGrid.innerHTML = '';
    if (!data.development || data.development.length === 0) {
      els.devCard.classList.add('is-empty');
      return;
    }
    els.devCard.classList.remove('is-empty');
    data.development.forEach(function (item) {
      var wrap = document.createElement('div');
      wrap.className = 'pt-dev-item';

      var icon = document.createElement('span');
      icon.className = 'pt-dev-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = item.icon;

      var copy = document.createElement('div');
      copy.className = 'pt-dev-copy';

      var label = document.createElement('span');
      label.className = 'pt-dev-label';
      label.textContent = item.label;

      var text = document.createElement('p');
      text.className = 'pt-dev-text';
      text.textContent = item.text;

      copy.appendChild(label);
      copy.appendChild(text);
      wrap.appendChild(icon);
      wrap.appendChild(copy);
      els.devGrid.appendChild(wrap);
    });
  }

  function renderChanges(data) {
    els.changesList.innerHTML = '';
    data.changesFromLastWeek.forEach(function (change) {
      var li = document.createElement('li');
      li.textContent = change;
      els.changesList.appendChild(li);
    });
  }

  function render() {
    var data = weekByNumber[state.week];
    if (!data) return;

    var percent = Math.round((state.week / TOTAL_WEEKS) * 100);

    // Week selector
    els.weekCurrent.textContent = 'Week ' + data.week;
    els.bottomWeek.textContent = 'Week ' + data.week;

    // Trimester pills
    els.trimesterPills.forEach(function (pill) {
      pill.classList.toggle('is-active', pill.getAttribute('data-trimester') === data.trimester);
    });

    // Progress
    els.progressText.textContent = 'Week ' + data.week + ' of ' + TOTAL_WEEKS;
    els.progressPercent.textContent = percent + '% of the journey';
    els.progressFill.style.width = percent + '%';
    els.progressTrack.setAttribute('aria-valuenow', String(percent));

    // Timeline
    refreshTimelineStates();

    // Illustration (with fade/scale)
    var img = els.illustration;
    img.classList.add('is-swapping');
    window.setTimeout(function () {
      img.src = data.illustration;
      img.alt = 'Illustration of baby development at pregnancy week ' + data.week;
      img.classList.remove('is-swapping');
    }, 160);
    els.captionWeek.textContent = 'Week ' + data.week;

    // Baby size
    els.sizeLength.textContent = data.babySize;
    els.sizeWeight.textContent = data.babyWeight;
    els.sizeComparison.textContent = data.sizeComparison || 'still very small';

    // Overview
    els.overviewBadge.textContent = 'Week ' + data.week;
    fadeSwap(els.headline.closest('.pt-overview-card'), function () {
      els.headline.textContent = data.headline;
      els.summary.textContent = data.summary;
    });

    // Changes
    fadeSwap(els.changesList.closest('.pt-card'), function () {
      renderChanges(data);
    });

    // Development
    fadeSwap(els.devCard, function () {
      renderDevelopment(data);
    });

    // Status + milestone
    els.statusWord.textContent = data.babyStatus.word;
    els.statusText.textContent = data.babyStatus.text;
    els.milestoneTitle.textContent = data.milestone.title;
    els.milestoneText.textContent = data.milestone.text;

    // Nav button states
    var atStart = state.week <= 1;
    var atEnd = state.week >= TOTAL_WEEKS;
    [els.prev, els.prevBottom].forEach(function (b) { b.disabled = atStart; });
    [els.next, els.nextBottom].forEach(function (b) { b.disabled = atEnd; });
  }

  function setWeek(week) {
    week = Math.max(1, Math.min(TOTAL_WEEKS, week));
    if (week === state.week) return;
    state.week = week;
    render();
    scrollTimelineToCurrent();
  }

  els.prev.addEventListener('click', function () { setWeek(state.week - 1); });
  els.next.addEventListener('click', function () { setWeek(state.week + 1); });
  els.prevBottom.addEventListener('click', function () { setWeek(state.week - 1); });
  els.nextBottom.addEventListener('click', function () { setWeek(state.week + 1); });

  root.addEventListener('keydown', function (e) {
    if (e.target.closest('.pt-timeline')) return; // let dots handle their own focus
    if (e.key === 'ArrowLeft') { setWeek(state.week - 1); }
    if (e.key === 'ArrowRight') { setWeek(state.week + 1); }
  });

  buildTimeline();
  render();
  // Initial scroll without smooth animation jank on load
  window.setTimeout(scrollTimelineToCurrent, 50);
})();
