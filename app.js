(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);

  // Builds DOM nodes with textContent only, so database content can never inject HTML.
  function el(tag, { className, text, attrs } = {}, children = []) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    for (const child of children) node.append(child);
    return node;
  }

  const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

  async function getJSON(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Request to ${url} failed (${res.status})`);
    return res.json();
  }

  function showNotice(container, message) {
    container.replaceChildren(el('p', { className: 'notice', text: message }));
  }

  // ---------- Profile ----------
  function renderProfile(p) {
    document.title = `${p.name} | ${p.title}`;

    document.querySelectorAll('[data-profile]').forEach((node) => {
      const value = p[node.dataset.profile];
      if (value) node.textContent = value;
    });

    const hrefs = {
      email: p.email ? `mailto:${p.email}` : null,
      github: isHttpUrl(p.github_url) ? p.github_url : null,
      linkedin: isHttpUrl(p.linkedin_url) ? p.linkedin_url : null,
    };
    document.querySelectorAll('[data-link]').forEach((a) => {
      const href = hrefs[a.dataset.link];
      if (href) {
        a.href = href;
        a.hidden = false;
      } else {
        a.hidden = true;
      }
    });
  }

  // ---------- Hero panel (shows the real API data) ----------
  function renderPanel(profile, projects, skills) {
    const data = {
      name: profile.name,
      title: profile.title,
      projects: projects.length,
      skills: skills.length,
    };
    const code = $('#panel-json');
    const lines = Object.entries(data).map(([key, value], i, all) => {
      const comma = i < all.length - 1 ? ',' : '';
      const frag = document.createDocumentFragment();
      frag.append('  ', el('span', { className: 'j-key', text: JSON.stringify(key) }), ': ');
      frag.append(
        typeof value === 'string' ? el('span', { className: 'j-str', text: JSON.stringify(value) }) : String(value),
        comma + '\n'
      );
      return frag;
    });
    code.replaceChildren('{\n', ...lines, '}');
  }

  // ---------- Projects ----------
  let allProjects = [];
  let activeTag = 'All';

  function projectCard(p) {
    const links = el('div', { className: 'project-links' });
    if (isHttpUrl(p.github_url)) {
      links.append(el('a', {
        text: 'View code',
        attrs: { href: p.github_url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `View code for ${p.title}` },
      }));
    }
    if (isHttpUrl(p.live_url)) {
      links.append(el('a', {
        text: 'Open live site',
        attrs: { href: p.live_url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `Open live site for ${p.title}` },
      }));
    }

    return el('article', { className: p.featured ? 'project featured' : 'project' }, [
      el('h3', { text: p.title }),
      el('p', { text: p.description }),
      el('ul', { className: 'tags', attrs: { 'aria-label': 'Technologies used' } },
        (p.tech || []).map((t) => el('li', { text: t }))),
      links,
    ]);
  }

  function renderProjects() {
    const grid = $('#project-grid');
    const list = activeTag === 'All' ? allProjects : allProjects.filter((p) => (p.tech || []).includes(activeTag));
    if (!list.length) return showNotice(grid, 'No projects use this technology yet.');
    grid.replaceChildren(...list.map(projectCard));
  }

  function renderFilters() {
    const wrap = $('#filters');
    const tags = [...new Set(allProjects.flatMap((p) => p.tech || []))].sort((a, b) => a.localeCompare(b));
    wrap.replaceChildren(
      ...['All', ...tags].map((tag) => {
        const btn = el('button', {
          className: 'chip',
          text: tag,
          attrs: { type: 'button', 'aria-pressed': String(tag === activeTag) },
        });
        btn.addEventListener('click', () => {
          activeTag = tag;
          wrap.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === btn)));
          renderProjects();
        });
        return btn;
      })
    );
  }

  // ---------- Skills ----------
  function renderSkills(skills) {
    const box = $('#skills');
    if (!skills.length) return showNotice(box, 'No skills added yet.');

    const groups = new Map();
    for (const s of skills) {
      if (!groups.has(s.category)) groups.set(s.category, []);
      groups.get(s.category).push(s);
    }

    box.replaceChildren(
      ...[...groups].map(([category, items]) =>
        el('div', { className: 'skill-group' }, [
          el('h3', { text: category }),
          el('ul', {}, items.map((s) =>
            el('li', {}, [
              el('span', { text: s.name }),
              el('span', {
                className: 'dots',
                attrs: { role: 'img', 'aria-label': `Proficiency ${s.level} out of 5` },
              }, Array.from({ length: 5 }, (_, i) => el('i', { className: i < s.level ? 'on' : '' }))),
            ])
          )),
        ])
      )
    );
  }

  // ---------- Contact form ----------
  function setupForm() {
    const form = $('#contact-form');
    const status = $('#form-status');
    const button = $('#send-btn');

    const setStatus = (message, kind) => {
      status.textContent = message;
      status.className = kind ? `status ${kind}` : 'status';
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      button.disabled = true;
      setStatus('Sending…', '');

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          form.reset();
          setStatus('Message sent. I will reply by email.', 'ok');
        } else {
          setStatus(data.error || 'The message could not be sent. Try again.', 'err');
        }
      } catch {
        setStatus('Could not reach the server. Check your connection and try again.', 'err');
      } finally {
        button.disabled = false;
      }
    });
  }

  // ---------- Boot ----------
  async function init() {
    $('#year').textContent = new Date().getFullYear();
    setupForm();

    const [profileRes, projectsRes, skillsRes] = await Promise.allSettled([
      getJSON('/api/profile'),
      getJSON('/api/projects'),
      getJSON('/api/skills'),
    ]);

    if (profileRes.status === 'fulfilled') renderProfile(profileRes.value);

    if (projectsRes.status === 'fulfilled') {
      allProjects = projectsRes.value;
      renderFilters();
      if (allProjects.length) renderProjects();
      else showNotice($('#project-grid'), 'No projects added yet.');
    } else {
      showNotice($('#project-grid'), 'Projects could not be loaded. Refresh the page to try again.');
    }

    if (skillsRes.status === 'fulfilled') renderSkills(skillsRes.value);
    else showNotice($('#skills'), 'Skills could not be loaded. Refresh the page to try again.');

    if (profileRes.status === 'fulfilled' && projectsRes.status === 'fulfilled' && skillsRes.status === 'fulfilled') {
      renderPanel(profileRes.value, projectsRes.value, skillsRes.value);
    } else {
      $('#panel-json').textContent = 'The API is not responding.\nCheck that the server and database are running.';
    }
  }

  init();
})();
