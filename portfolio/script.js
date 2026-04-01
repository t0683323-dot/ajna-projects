const revealTargets = document.querySelectorAll('.section, .status-card');

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  }
}, { threshold: 0.18 });

for (const element of revealTargets) {
  element.classList.add('reveal');
  observer.observe(element);
}
