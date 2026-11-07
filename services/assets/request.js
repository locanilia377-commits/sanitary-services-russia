(() => {
  'use strict';

  const root = document.querySelector('[data-request]');
  if (!root) return;

  const form = root.querySelector('form');
  const result = root.querySelector('[data-request-result]');
  const draft = root.querySelector('[data-request-draft]');
  const status = root.querySelector('[data-request-status]');
  const send = root.querySelector('[data-request-send]');
  const fields = Object.fromEntries(
    Array.from(form.querySelectorAll('[data-request-field]'), field => [field.dataset.requestField, field])
  );
  const routeValue = root.dataset.route.trim();
  const email = routeValue.replace(/^mailto:/i, '');
  const emailRoute = /^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);
  let linkRoute;

  if (!emailRoute && routeValue) {
    try {
      const url = new URL(routeValue);
      if (url.protocol === 'https:' && !url.username && !url.password) linkRoute = url;
    } catch {
      // An unconfigured or invalid route leaves the local draft tools available.
    }
  }

  const routeLabel = root.dataset.routeLabel.trim();
  const noDelivery = 'Черновик готов. Заявка не отправлена.';
  if (!emailRoute && !linkRoute) {
    status.textContent = 'Форма готовит черновик. Его можно скопировать или скачать.';
  }
  form.hidden = false;

  fields.object.addEventListener('input', () => fields.object.setCustomValidity(''));

  form.addEventListener('submit', event => {
    event.preventDefault();

    const object = fields.object.value.trim();
    if (!object) {
      fields.object.setCustomValidity('Укажите тип объекта.');
      fields.object.reportValidity();
      return;
    }

    const { service, audience } = root.dataset;
    const subject = `Заявка на расчёт — ${service}`;
    const lines = [
      subject,
      `Сегмент: ${audience}`,
      `Город: ${fields.city.value}`,
      `Тип объекта: ${object}`,
    ];

    if (fields.area.value) lines.push(`Примерная площадь: ${fields.area.value} м²`);
    if (fields.window.value.trim()) lines.push(`Удобное время: ${fields.window.value.trim()}`);
    if (fields.details.value.trim()) lines.push(`Задача: ${fields.details.value.trim()}`);
    draft.value = lines.join('\n');

    if (emailRoute) {
      send.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\r\n'))}`;
      send.textContent = routeLabel || 'Открыть почтовое приложение';
      send.hidden = false;
    } else if (linkRoute) {
      send.href = linkRoute.href;
      send.textContent = routeLabel || 'Открыть канал для заявки';
      send.target = '_blank';
      send.rel = 'noopener noreferrer';
      send.hidden = false;
    }

    result.hidden = false;
    status.textContent = linkRoute
      ? `${noDelivery} Скопируйте текст и вставьте его в открывшемся канале.`
      : noDelivery;
    draft.focus();
  });

  root.querySelector('[data-request-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(draft.value);
      status.textContent = 'Текст скопирован. Заявка не отправлена.';
    } catch {
      draft.focus();
      draft.select();
      status.textContent = 'Текст выделен. Скопируйте его вручную. Заявка не отправлена.';
    }
  });

  root.querySelector('[data-request-download]').addEventListener('click', () => {
    const file = new Blob([draft.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const download = document.createElement('a');
    download.href = url;
    download.download = 'zayavka-na-raschet.txt';
    document.body.append(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    status.textContent = 'Файл подготовлен. Заявка не отправлена.';
  });
})();
