// Public contact destinations already published on the portfolio.
export const publicContactLinks = {
  LinkedIn: 'https://www.linkedin.com/in/rashinkp/',
  GitHub: 'https://github.com/rashinkp',
  LeetCode: 'https://leetcode.com/u/rashinkp/',
  Email: 'mailto:rashinkp001@gmail.com',
}

export const publicContactReference = Object.entries(publicContactLinks)
  .map(([label, url]) => `${label}: ${url}`).join('\n')
