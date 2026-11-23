const imageByCategory = {
  Aadhaar: '/images/aadhar.jpg',
  PAN: '/images/pan.jpg',
  'Voter ID': '/images/voter.jpg',
  'Driving Licence': '/images/driving.jpg',
  'Ration Card': '/images/ration.jpg',
  Certificates: '/images/certificates.jpg',
  'Bill Payments': '/images/bills.jpg',
};

const imageByName = [
  { match: /caste/i, src: '/images/caste.jpg' },
  { match: /income/i, src: '/images/income.png' },
  { match: /residence/i, src: '/images/residence.jpeg' },
];

export function getServiceImage(category, serviceName = '') {
  const namedImage = imageByName.find(({ match }) => match.test(serviceName));
  return namedImage?.src || imageByCategory[category] || '/images/certificates.jpg';
}
