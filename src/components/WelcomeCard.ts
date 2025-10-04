import { branding } from '@/config/content';

export const renderWelcomeCard = (): string => {
  const { name, greeting, tagline } = branding;

  return `
    <section
      class="welcome-card chat-welcome-card border-2 border-gray-800 bg-gray-900/50 p-6 md:p-8 rounded-lg hover:shadow-brutal transition-shadow duration-200"
      aria-labelledby="welcome-card-heading"
    >
      <span class="block text-xs md:text-sm font-semibold tracking-widest text-neon-cyan uppercase mb-3">
        ${name}
      </span>
      <h1 id="welcome-card-heading" class="text-3xl md:text-4xl font-black leading-tight mb-4">
        ${greeting}
      </h1>
      <p class="text-gray-300 text-base md:text-lg leading-relaxed">${tagline}</p>
    </section>
  `;
};
