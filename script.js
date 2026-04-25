const STORAGE_KEY = 'dzOfferFlowData';

const packageKeys = ['basic', 'standard', 'premium'];

const packageDefaults = {
  basic: {
    title: 'Starter Plan',
    description: 'Ideal for quick-launch projects and tighter budgets.',
    price: 499,
    features: ['1 landing page', '2 revisions', 'Email support']
  },
  standard: {
    title: 'Growth Plan',
    description: 'Balanced scope and support for steady business growth.',
    price: 999,
    features: ['Up to 5 pages', '5 revisions', 'Priority support']
  },
  premium: {
    title: 'Scale Plan',
    description: 'Comprehensive execution with top-priority delivery.',
    price: 1999,
    features: ['Unlimited pages', 'Unlimited revisions', 'Dedicated manager']
  }
};

const form = document.getElementById('offerForm');
const previewPackages = document.getElementById('previewPackages');
const downloadBtn = document.getElementById('downloadPdf');

const previewFields = {
  businessName: document.getElementById('previewBusinessName'),
  clientName: document.getElementById('previewClientName'),
  offerNumber: document.getElementById('previewOfferNumber'),
  date: document.getElementById('previewDate'),
  projectDescription: document.getElementById('previewProjectDescription')
};

function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return '$0';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: number % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(number);
}

function formatDisplayDate(isoDate) {
  if (!isoDate) {
    return '-';
  }

  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return '-';
  }

  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function generateOfferNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `DZ-${datePart}-${randomPart}`;
}

function getPackageData(key) {
  const title = form.elements[`${key}Title`].value.trim() || packageDefaults[key].title;
  const description = form.elements[`${key}Description`].value.trim() || packageDefaults[key].description;
  const price = form.elements[`${key}Price`].value;

  const featureLines = form.elements[`${key}Features`].value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  const features = featureLines.length ? featureLines : packageDefaults[key].features;

  return {
    key,
    title,
    description,
    price: Number(price) > 0 ? Number(price) : packageDefaults[key].price,
    features
  };
}

function getFormData() {
  return {
    businessName: form.elements.businessName.value.trim(),
    clientName: form.elements.clientName.value.trim(),
    projectDescription: form.elements.projectDescription.value.trim(),
    offerDate: form.elements.offerDate.value,
    offerNumber: form.elements.offerNumber.value,
    recommendedPackage: form.elements.recommendedPackage.value,
    packages: packageKeys.reduce((acc, key) => {
      const data = getPackageData(key);
      acc[key] = {
        title: form.elements[`${key}Title`].value,
        description: form.elements[`${key}Description`].value,
        price: form.elements[`${key}Price`].value,
        features: form.elements[`${key}Features`].value,
        preview: data
      };
      return acc;
    }, {})
  };
}

function renderPreview() {
  const data = getFormData();

  previewFields.businessName.textContent = data.businessName || 'Your Business';
  previewFields.clientName.textContent = data.clientName || 'Client Name';
  previewFields.offerNumber.textContent = data.offerNumber || '-';
  previewFields.date.textContent = formatDisplayDate(data.offerDate);
  previewFields.projectDescription.textContent = data.projectDescription || 'Project details appear here.';

  const cardsMarkup = packageKeys
    .map((key) => {
      const pkg = data.packages[key].preview;
      const isRecommended = data.recommendedPackage === key;

      return `
        <div class="preview-card ${isRecommended ? 'recommended' : ''}">
          ${isRecommended ? '<span class="badge">Most Popular</span>' : ''}
          <h4>${pkg.title}</h4>
          <p class="pkg-desc">${pkg.description}</p>
          <div class="pkg-price">${formatCurrency(pkg.price)}</div>
          <ul>
            ${pkg.features.map((feature) => `<li>${feature}</li>`).join('')}
          </ul>
        </div>
      `;
    })
    .join('');

  previewPackages.innerHTML = cardsMarkup;
}

function saveToLocalStorage() {
  const data = getFormData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function hydrateFromData(savedData) {
  const defaults = {
    businessName: 'DZ Media',
    clientName: '',
    projectDescription: '',
    offerDate: getTodayIsoDate(),
    offerNumber: generateOfferNumber(),
    recommendedPackage: 'standard'
  };

  const merged = { ...defaults, ...savedData };

  form.elements.businessName.value = merged.businessName;
  form.elements.clientName.value = merged.clientName;
  form.elements.projectDescription.value = merged.projectDescription;
  form.elements.offerDate.value = merged.offerDate;
  form.elements.offerNumber.value = merged.offerNumber;
  form.elements.recommendedPackage.value = merged.recommendedPackage;

  packageKeys.forEach((key) => {
    const savedPackage = savedData?.packages?.[key] || {};
    form.elements[`${key}Title`].value = savedPackage.title ?? packageDefaults[key].title;
    form.elements[`${key}Description`].value = savedPackage.description ?? packageDefaults[key].description;
    form.elements[`${key}Price`].value = savedPackage.price ?? packageDefaults[key].price;
    form.elements[`${key}Features`].value =
      savedPackage.features ?? packageDefaults[key].features.join('\n');
  });
}

function initializeForm() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      hydrateFromData(parsed);
      return;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  hydrateFromData({});
}

function wrapText(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(text || '', maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function downloadOfferPdf() {
  const data = getFormData();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const startX = 26;
  const contentWidth = pageWidth - 52;

  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(data.businessName || 'Your Business', startX, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Client: ${data.clientName || 'Client Name'}`, startX, 58);
  doc.text(`Offer #: ${data.offerNumber || '-'}`, startX + 230, 58);
  doc.text(`Date: ${formatDisplayDate(data.offerDate)}`, startX + 430, 58);

  doc.setFontSize(10);
  doc.setTextColor(185, 185, 185);
  doc.text(`Project: ${data.projectDescription || 'Project details appear here.'}`, startX, 76);

  const gap = 14;
  const boxWidth = (contentWidth - gap * 2) / 3;
  const boxTop = 95;
  const boxHeight = 300;

  packageKeys.forEach((key, index) => {
    const pkg = data.packages[key].preview;
    const x = startX + index * (boxWidth + gap);
    const recommended = data.recommendedPackage === key;

    doc.setFillColor(recommended ? 43 : 25, recommended ? 45 : 25, recommended ? 89 : 25);
    doc.setDrawColor(recommended ? 123 : 56, recommended ? 120 : 56, recommended ? 255 : 56);
    doc.roundedRect(x, boxTop, boxWidth, boxHeight, 10, 10, 'FD');

    if (recommended) {
      doc.setFillColor(93, 95, 239);
      doc.roundedRect(x + boxWidth - 106, boxTop - 12, 92, 18, 8, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('Most Popular', x + boxWidth - 88, boxTop + 1);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(pkg.title, x + 14, boxTop + 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(190, 190, 190);
    let y = wrapText(doc, pkg.description, x + 14, boxTop + 42, boxWidth - 28, 11);

    doc.setTextColor(220, 222, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(formatCurrency(pkg.price), x + 14, y + 20);

    doc.setTextColor(235, 235, 235);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    let bulletY = y + 38;
    pkg.features.forEach((feature) => {
      const lines = doc.splitTextToSize(`• ${feature}`, boxWidth - 28);
      doc.text(lines, x + 14, bulletY);
      bulletY += lines.length * 11 + 2;
    });
  });

  doc.setTextColor(165, 165, 165);
  doc.setFontSize(9);
  doc.text('Generated by DZ Media', pageWidth - 145, doc.internal.pageSize.getHeight() - 20);

  const safeName = (data.clientName || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`dz-offer-${safeName || 'offer'}.pdf`);
}

function handleInput() {
  renderPreview();
  saveToLocalStorage();
}

initializeForm();
renderPreview();

form.addEventListener('input', handleInput);
form.addEventListener('change', handleInput);
downloadBtn.addEventListener('click', downloadOfferPdf);

// Submitting is intentionally disabled because this is a front-end-only tool.
form.addEventListener('submit', (event) => {
  event.preventDefault();
});
