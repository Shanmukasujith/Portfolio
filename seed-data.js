// Starter content. Edit this file, then run `npm run db:reset` to reload it.
// (db:reset DELETES existing rows, including contact messages.)

module.exports = {
  profile: {
    name: 'Alex Morgan',
    title: 'Full-stack developer',
    tagline: 'I build web apps from the database to the browser.',
    bio:
      'I enjoy turning rough ideas into small, dependable products. ' +
      'My work covers the whole stack: designing database schemas, writing REST APIs, ' +
      'and building fast, accessible interfaces. Replace this paragraph with your own story.',
    email: 'you@example.com',
    github_url: 'https://github.com/your-username',
    linkedin_url: 'https://www.linkedin.com/in/your-username',
  },

  projects: [
    {
      title: 'TaskBoard',
      description:
        'A kanban-style task manager with drag-and-drop columns, user accounts, and real-time updates.',
      tech: ['React', 'Node.js', 'Express', 'PostgreSQL'],
      github_url: 'https://github.com/your-username/taskboard',
      live_url: null,
      featured: true,
    },
    {
      title: 'Recipe Finder',
      description:
        'Search recipes by the ingredients you already have, with saved favourites and shopping lists.',
      tech: ['JavaScript', 'Express', 'MongoDB'],
      github_url: 'https://github.com/your-username/recipe-finder',
      live_url: null,
      featured: false,
    },
    {
      title: 'Expense Tracker',
      description:
        'Track spending by category and view monthly summaries as charts. Includes CSV export.',
      tech: ['Django', 'PostgreSQL', 'Chart.js'],
      github_url: 'https://github.com/your-username/expense-tracker',
      live_url: null,
      featured: false,
    },
    {
      title: 'Weather Dashboard',
      description:
        'A responsive dashboard showing current conditions and a five-day forecast for saved cities.',
      tech: ['HTML', 'CSS', 'JavaScript'],
      github_url: 'https://github.com/your-username/weather-dashboard',
      live_url: null,
      featured: false,
    },
  ],

  skills: [
    { name: 'HTML & CSS', category: 'Frontend', level: 5 },
    { name: 'JavaScript', category: 'Frontend', level: 5 },
    { name: 'React', category: 'Frontend', level: 4 },
    { name: 'Node.js', category: 'Backend', level: 4 },
    { name: 'Express', category: 'Backend', level: 4 },
    { name: 'REST API design', category: 'Backend', level: 4 },
    { name: 'PostgreSQL', category: 'Databases', level: 4 },
    { name: 'MongoDB', category: 'Databases', level: 3 },
    { name: 'SQL modelling', category: 'Databases', level: 4 },
    { name: 'Git & GitHub', category: 'Tools and deployment', level: 5 },
    { name: 'Heroku', category: 'Tools and deployment', level: 4 },
    { name: 'Netlify & Vercel', category: 'Tools and deployment', level: 3 },
  ],
};
