// services.js — SevaSaathi service catalogue
// NOTE: fees are INDICATIVE (government fee + service charge). Verify against the
// latest official notification / your state portal before going live.

const rupees = (r) => Math.round(r * 100);

// ---------- Reusable form fields (same field types your validator already uses) ----------
const F = {
  aadhaar: { name: 'aadhaar', label: 'Aadhaar Number', type: 'aadhaar', required: true },
  fullName: { name: 'fullName', label: 'Full Name (as per Aadhaar)', type: 'string', required: true, min: 2, max: 100 },
  fatherName: { name: 'fatherName', label: "Father's / Husband's Name", type: 'string', required: true, min: 2, max: 100 },
  dob: { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
  gender: { name: 'gender', label: 'Gender', type: 'enum', options: ['male', 'female', 'other'], required: true },
  phone: { name: 'phone', label: 'Mobile Number', type: 'phone', required: true },
  address: { name: 'address', label: 'Full Residential Address', type: 'string', required: true, min: 10, max: 500 },
  district: { name: 'district', label: 'District', type: 'string', required: true, min: 2, max: 60 },
  pincode: { name: 'pincode', label: 'PIN Code', type: 'string', required: true, min: 6, max: 6 },
};

export const SERVICES = [
  // =====================================================================
  // AADHAAR
  // =====================================================================
  {
    slug: 'aadhaar-address-update', name: 'Aadhaar – Address Update', category: 'Aadhaar',
    description: 'Update residential address on your Aadhaar card with valid proof.', feePaise: rupees(50),
    requiredDocuments: ['Address Proof', 'Aadhaar Copy'],
    formSchema: { fields: [
      { name: 'aadhaar', label: 'Aadhaar Number', type: 'aadhaar', required: true },
      { name: 'fullName', label: 'Full Name', type: 'string', required: true, min: 2, max: 100 },
      { name: 'newAddress', label: 'New Address', type: 'string', required: true, min: 10, max: 500 },
      { name: 'phone', label: 'Mobile', type: 'phone', required: true },
    ] },
  },
  {
    slug: 'aadhaar-mobile-update', name: 'Aadhaar – Mobile Number Update', category: 'Aadhaar',
    description: 'Link or change the mobile number registered with your Aadhaar. Requires biometric authentication at the centre. UIDAI fee ₹50 (incl. GST). Update reflects in 5–7 working days; an Update Request Number (URN) is issued as acknowledgement.',
    feePaise: rupees(50),
    requiredDocuments: ['Aadhaar Copy'],
    formSchema: { fields: [
      F.aadhaar, F.fullName,
      { name: 'oldMobile', label: 'Previously Registered Mobile (if any)', type: 'phone', required: false },
      { name: 'newMobile', label: 'New Mobile Number', type: 'phone', required: true },
    ] },
  },
  {
    slug: 'aadhaar-demographic-correction', name: 'Aadhaar – Name / DOB / Gender Correction', category: 'Aadhaar',
    description: 'Correct name, date of birth or gender on your Aadhaar. Supporting proof is mandatory. Name and DOB changes are limited by UIDAI rules (DOB: once, name: twice in a lifetime). UIDAI fee ₹50 (incl. GST).',
    feePaise: rupees(50),
    requiredDocuments: ['Aadhaar Copy', 'Proof of Identity', 'Proof of Date of Birth (for DOB change)'],
    formSchema: { fields: [
      F.aadhaar,
      { name: 'fieldToCorrect', label: 'What needs correction?', type: 'enum', options: ['name', 'date_of_birth', 'gender'], required: true },
      { name: 'currentValue', label: 'Current Value on Aadhaar', type: 'string', required: true, min: 1, max: 100 },
      { name: 'correctValue', label: 'Correct Value', type: 'string', required: true, min: 1, max: 100 },
      F.phone,
    ] },
  },
  {
    slug: 'aadhaar-biometric-update', name: 'Aadhaar – Biometric Update (Photo / Fingerprint / Iris)', category: 'Aadhaar',
    description: 'Update photograph, fingerprints and iris. Mandatory for children at age 5 and again at 15 (free for children in these age bands). UIDAI fee ₹100 (incl. GST) for adults. Visit to the centre is required.',
    feePaise: rupees(100),
    requiredDocuments: ['Aadhaar Copy'],
    formSchema: { fields: [
      F.aadhaar, F.fullName, F.dob,
      { name: 'updateType', label: 'Update Type', type: 'enum', options: ['photo', 'fingerprint', 'iris', 'all_biometrics'], required: true },
      F.phone,
    ] },
  },
  {
    slug: 'aadhaar-pvc-card', name: 'Aadhaar PVC Card – Order', category: 'Aadhaar',
    description: 'Order a durable, wallet-sized PVC Aadhaar card with QR code and security features. UIDAI charge ₹50 (incl. GST and speed-post). Delivered to your registered address in about 5–10 working days. OTP on the registered mobile is required.',
    feePaise: rupees(50),
    requiredDocuments: ['Aadhaar Copy'],
    formSchema: { fields: [F.aadhaar, F.fullName, { name: 'registeredMobile', label: 'Registered Mobile (receives OTP)', type: 'phone', required: true }] },
  },

  // =====================================================================
  // PAN
  // =====================================================================
  {
    slug: 'pan-new', name: 'PAN – New Application', category: 'PAN',
    description: 'Apply for a new PAN card for Indian citizens.', feePaise: rupees(107),
    requiredDocuments: ['Aadhaar Copy', 'Photo', 'Signature'],
    formSchema: { fields: [
      { name: 'fullName', label: 'Full Name', type: 'string', required: true, min: 2, max: 100 },
      { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { name: 'gender', label: 'Gender', type: 'enum', options: ['male', 'female', 'other'], required: true },
      { name: 'aadhaar', label: 'Aadhaar Number', type: 'aadhaar', required: true },
      { name: 'phone', label: 'Mobile', type: 'phone', required: true },
    ] },
  },
  {
    slug: 'pan-correction', name: 'PAN – Correction / Reprint', category: 'PAN',
    description: 'Correct name, date of birth, address or photo on an existing PAN, or request a reprint of a lost/damaged card. NSDL/UTIITSL fee ₹107 (Indian address). The same PAN number is retained.',
    feePaise: rupees(107),
    requiredDocuments: ['PAN Card Copy', 'Aadhaar Copy', 'Supporting Proof for Correction'],
    formSchema: { fields: [
      { name: 'panNumber', label: 'Existing PAN Number', type: 'string', required: true, min: 10, max: 10 },
      F.fullName, F.dob,
      { name: 'requestType', label: 'Request Type', type: 'enum', options: ['name_correction', 'dob_correction', 'address_change', 'photo_signature_change', 'reprint'], required: true },
      { name: 'details', label: 'Details of the Change', type: 'string', required: true, min: 5, max: 300 },
      F.phone,
    ] },
  },
  {
    slug: 'pan-aadhaar-link', name: 'PAN – Aadhaar Linking', category: 'PAN',
    description: 'Link your PAN with Aadhaar on the Income Tax e-filing portal. Unlinked PANs become inoperative. A ₹1,000 government fee is payable for linking after the due date (Section 234H); the linking is completed within 4–5 working days of payment.',
    feePaise: rupees(1000),
    requiredDocuments: ['PAN Card Copy', 'Aadhaar Copy'],
    formSchema: { fields: [
      { name: 'panNumber', label: 'PAN Number', type: 'string', required: true, min: 10, max: 10 },
      F.aadhaar, F.fullName, F.phone,
    ] },
  },

  // =====================================================================
  // CERTIFICATES (Maharashtra – Aaple Sarkar style)
  // =====================================================================
  {
    slug: 'birth-certificate', name: 'Birth Certificate', category: 'Certificates',
    description: 'Register a birth and obtain a birth certificate.', feePaise: rupees(100),
    requiredDocuments: ['Hospital Record', 'Parents Aadhaar Copy'],
    formSchema: { fields: [
      { name: 'childName', label: "Child's Name", type: 'string', required: true, min: 2, max: 100 },
      { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { name: 'hospital', label: 'Hospital', type: 'string', required: true, min: 2, max: 200 },
    ] },
  },
  {
    slug: 'death-certificate', name: 'Death Certificate', category: 'Certificates',
    description: 'Register a death and obtain a certified death certificate. Registration must be done within 21 days of the event; delayed registration needs an affidavit and may need additional approval.',
    feePaise: rupees(100),
    requiredDocuments: ['Hospital / Cremation Record', 'Deceased Aadhaar Copy', 'Applicant Aadhaar Copy'],
    formSchema: { fields: [
      { name: 'deceasedName', label: "Deceased Person's Name", type: 'string', required: true, min: 2, max: 100 },
      { name: 'dateOfDeath', label: 'Date of Death', type: 'date', required: true },
      { name: 'placeOfDeath', label: 'Place of Death (Hospital / Address)', type: 'string', required: true, min: 2, max: 200 },
      { name: 'causeOfDeath', label: 'Cause of Death (as per medical record)', type: 'string', required: false, max: 200 },
      { name: 'applicantRelation', label: 'Your Relation to Deceased', type: 'string', required: true, min: 2, max: 50 },
      F.phone,
    ] },
  },
  {
    slug: 'marriage-certificate', name: 'Marriage Certificate', category: 'Certificates',
    description: 'Register a marriage under the Hindu Marriage Act / Special Marriage Act and obtain a certificate. Both spouses and two witnesses must be present at the registrar for verification.',
    feePaise: rupees(150),
    requiredDocuments: ['Husband Aadhaar Copy', 'Wife Aadhaar Copy', 'Marriage Photo', 'Wedding Invitation / Priest Certificate', 'Witness ID Proofs (2)', 'Passport-size Photos'],
    formSchema: { fields: [
      { name: 'husbandName', label: "Husband's Full Name", type: 'string', required: true, min: 2, max: 100 },
      { name: 'wifeName', label: "Wife's Full Name", type: 'string', required: true, min: 2, max: 100 },
      { name: 'marriageDate', label: 'Date of Marriage', type: 'date', required: true },
      { name: 'marriagePlace', label: 'Place of Marriage', type: 'string', required: true, min: 2, max: 200 },
      { name: 'marriageAct', label: 'Registration Under', type: 'enum', options: ['hindu_marriage_act', 'special_marriage_act'], required: true },
      F.phone,
    ] },
  },
  {
    slug: 'income-certificate', name: 'Income Certificate', category: 'Certificates',
    description: 'Certificate of annual family income issued by the Tahsildar, used for scholarships, fee concessions and welfare schemes. Normally issued in 7–15 working days; valid for the financial year.',
    feePaise: rupees(50),
    requiredDocuments: ['Aadhaar Copy', 'Ration Card', 'Salary Slip / Form 16 / Self-Declaration of Income', 'Address Proof', 'Passport-size Photo'],
    formSchema: { fields: [
      F.aadhaar, F.fullName, F.fatherName,
      { name: 'occupation', label: 'Occupation', type: 'string', required: true, min: 2, max: 100 },
      { name: 'annualIncome', label: 'Total Annual Family Income (INR)', type: 'number', required: true },
      { name: 'purpose', label: 'Purpose', type: 'enum', options: ['scholarship', 'school_college_admission', 'government_scheme', 'other'], required: true },
      F.address, F.phone,
    ] },
  },
  {
    slug: 'caste-certificate', name: 'Caste Certificate', category: 'Certificates',
    description: 'Certificate of caste / tribe (SC / ST / OBC / VJNT / SBC) issued by the competent authority. Needed for reservation benefits in education and jobs. Pre-1967 caste records (father / grandfather) are normally required as proof.',
    feePaise: rupees(50),
    requiredDocuments: ['Aadhaar Copy', "Father's Caste Certificate / School Leaving Certificate", 'Ration Card', 'Address Proof', 'Affidavit', 'Passport-size Photo'],
    formSchema: { fields: [
      F.aadhaar, F.fullName, F.fatherName,
      { name: 'category', label: 'Category', type: 'enum', options: ['sc', 'st', 'obc', 'vjnt', 'sbc', 'other'], required: true },
      { name: 'caste', label: 'Caste / Tribe Name', type: 'string', required: true, min: 2, max: 100 },
      F.address, F.phone,
    ] },
  },
  {
    slug: 'non-creamy-layer-certificate', name: 'Non-Creamy Layer Certificate', category: 'Certificates',
    description: 'Certificate for OBC / VJNT / SBC candidates confirming they are outside the creamy layer. Required for OBC reservation in education and central/state jobs. Valid for one year; income of the last 3 years is considered.',
    feePaise: rupees(50),
    requiredDocuments: ['Caste Certificate', 'Income Certificate / Salary Slips', 'Aadhaar Copy', "Father's Occupation Proof", 'Passport-size Photo'],
    formSchema: { fields: [
      F.aadhaar, F.fullName, F.fatherName,
      { name: 'caste', label: 'Caste / Community', type: 'string', required: true, min: 2, max: 100 },
      { name: 'familyIncome', label: 'Annual Family Income (INR)', type: 'number', required: true },
      F.phone,
    ] },
  },
  {
    slug: 'domicile-certificate', name: 'Domicile / Residence Certificate', category: 'Certificates',
    description: 'Certificate proving permanent residence in the state, needed for admissions, state-quota seats and government jobs. Usually requires proof of 15 years of residence in the state.',
    feePaise: rupees(50),
    requiredDocuments: ['Aadhaar Copy', 'School Leaving Certificate / Birth Certificate', 'Ration Card', 'Electricity Bill / Property Document', "Father's Domicile Proof", 'Passport-size Photo'],
    formSchema: { fields: [
      F.aadhaar, F.fullName, F.fatherName, F.dob,
      { name: 'yearsOfResidence', label: 'Years of Residence in the State', type: 'number', required: true },
      F.address, F.district, F.phone,
    ] },
  },

  // =====================================================================
  // IDENTITY & WELFARE
  // =====================================================================
  {
    slug: 'voter-id-new', name: 'Voter ID – New Registration (Form 6)', category: 'Identity & Welfare',
    description: 'Register as a new voter and apply for an EPIC (Voter ID) card. For citizens aged 18+ on the qualifying date. Election Commission fee is nil; only a service charge applies. Verification by the Booth Level Officer (BLO) is part of the process.',
    feePaise: rupees(30),
    requiredDocuments: ['Passport-size Photo', 'Age Proof (Birth Certificate / 10th Marksheet)', 'Address Proof', 'Aadhaar Copy'],
    formSchema: { fields: [
      F.fullName, F.fatherName, F.dob, F.gender, F.aadhaar, F.address, F.district, F.phone,
    ] },
  },
  {
    slug: 'voter-id-correction', name: 'Voter ID – Correction / Address Change (Form 8)', category: 'Identity & Welfare',
    description: 'Correct details in the electoral roll, shift residence, replace EPIC or change photo. Election Commission fee is nil; only a service charge applies.',
    feePaise: rupees(30),
    requiredDocuments: ['Voter ID Copy', 'Supporting Proof for Correction', 'Passport-size Photo (if changing)'],
    formSchema: { fields: [
      { name: 'epicNumber', label: 'EPIC (Voter ID) Number', type: 'string', required: true, min: 8, max: 12 },
      F.fullName,
      { name: 'correctionType', label: 'Correction Type', type: 'enum', options: ['name', 'address_shift', 'dob', 'photo', 'replacement_epic'], required: true },
      { name: 'details', label: 'Correct Details', type: 'string', required: true, min: 3, max: 300 },
      F.phone,
    ] },
  },
  {
    slug: 'ration-card-new', name: 'Ration Card – New Application', category: 'Identity & Welfare',
    description: 'Apply for a new ration card (Priority Household / Antyodaya / APL) under the National Food Security Act to receive subsidised foodgrain from the Public Distribution System.',
    feePaise: rupees(50),
    requiredDocuments: ['Aadhaar Copy of all members', 'Address Proof', 'Income Certificate', 'Passport-size Photo of Head of Family', 'Gas Connection Proof', 'Bank Passbook Copy'],
    formSchema: { fields: [
      { name: 'headOfFamily', label: 'Head of Family', type: 'string', required: true, min: 2, max: 100 },
      F.aadhaar,
      { name: 'familyMembers', label: 'Number of Family Members', type: 'number', required: true },
      { name: 'annualIncome', label: 'Annual Family Income (INR)', type: 'number', required: true },
      { name: 'cardType', label: 'Card Type', type: 'enum', options: ['priority_household', 'antyodaya', 'above_poverty_line'], required: true },
      F.address, F.phone,
    ] },
  },
  {
    slug: 'ayushman-bharat-card', name: 'Ayushman Bharat (PM-JAY) Card', category: 'Identity & Welfare',
    description: 'Generate your Ayushman Card for cashless treatment up to ₹5 lakh per family per year at empanelled hospitals. Eligibility is checked against SECC data. Government fee is nil; only a service charge applies.',
    feePaise: rupees(30),
    requiredDocuments: ['Aadhaar Copy', 'Ration Card', 'Mobile Linked to Aadhaar'],
    formSchema: { fields: [
      F.aadhaar, F.fullName,
      { name: 'rationCardNumber', label: 'Ration Card Number', type: 'string', required: false, max: 30 },
      F.district, F.phone,
    ] },
  },
  {
    slug: 'e-shram-card', name: 'e-Shram Card Registration', category: 'Identity & Welfare',
    description: 'Register on the e-Shram portal of the Ministry of Labour & Employment as an unorganised worker and receive a Universal Account Number (UAN) with ₹2 lakh accident insurance cover under PM-SYM. For workers aged 16–59 who are not EPFO/ESIC members.',
    feePaise: rupees(30),
    requiredDocuments: ['Aadhaar Copy', 'Bank Passbook Copy', 'Mobile Linked to Aadhaar'],
    formSchema: { fields: [
      F.aadhaar, F.fullName, F.dob,
      { name: 'occupation', label: 'Occupation', type: 'string', required: true, min: 2, max: 100 },
      { name: 'monthlyIncome', label: 'Monthly Income (INR)', type: 'number', required: true },
      { name: 'bankAccount', label: 'Bank Account Number', type: 'string', required: true, min: 9, max: 18 },
      { name: 'ifsc', label: 'Bank IFSC Code', type: 'string', required: true, min: 11, max: 11 },
      F.phone,
    ] },
  },
  {
    slug: 'pm-kisan-registration', name: 'PM-KISAN – Farmer Registration', category: 'Identity & Welfare',
    description: 'Register for PM-KISAN income support of ₹6,000 per year (3 instalments of ₹2,000) for landholding farmer families. e-KYC and bank seeding with Aadhaar are mandatory for payment.',
    feePaise: rupees(30),
    requiredDocuments: ['Aadhaar Copy', '7/12 Extract (Land Record)', 'Bank Passbook Copy'],
    formSchema: { fields: [
      F.aadhaar, F.fullName,
      { name: 'landSurveyNumber', label: 'Land Survey / Gat Number', type: 'string', required: true, min: 1, max: 50 },
      { name: 'landAreaHectare', label: 'Land Area (Hectares)', type: 'number', required: true },
      { name: 'bankAccount', label: 'Bank Account Number', type: 'string', required: true, min: 9, max: 18 },
      { name: 'ifsc', label: 'Bank IFSC Code', type: 'string', required: true, min: 11, max: 11 },
      F.district, F.phone,
    ] },
  },
  {
    slug: 'scholarship-application', name: 'Scholarship Application (NSP)', category: 'Identity & Welfare',
    description: 'Apply for central and state scholarships through the National Scholarship Portal (Pre-Matric, Post-Matric, Merit-cum-Means). Income, caste and previous-year marksheet are verified by the institution.',
    feePaise: rupees(50),
    requiredDocuments: ['Aadhaar Copy', 'Income Certificate', 'Caste Certificate (if applicable)', 'Previous Marksheet', 'Bank Passbook Copy', 'Institute Bonafide / Fee Receipt'],
    formSchema: { fields: [
      F.aadhaar, F.fullName, F.dob,
      { name: 'schemeType', label: 'Scholarship Type', type: 'enum', options: ['pre_matric', 'post_matric', 'merit_cum_means', 'other'], required: true },
      { name: 'institution', label: 'School / College Name', type: 'string', required: true, min: 2, max: 200 },
      { name: 'course', label: 'Class / Course', type: 'string', required: true, min: 1, max: 100 },
      { name: 'previousPercentage', label: 'Previous Year Percentage', type: 'number', required: true },
      F.phone,
    ] },
  },

  // =====================================================================
  // TRANSPORT
  // =====================================================================
  {
    slug: 'learners-licence', name: "Learner's Licence (LL)", category: 'Transport',
    description: "Apply for a learner's licence via the Parivahan Sarathi portal. Includes slot booking for the online LL test. Minimum age 16 (gearless, up to 50cc), 18 (others), 20 (transport vehicles). Valid for 6 months. Govt fee ₹150 + test fee ₹50 (varies by state).",
    feePaise: rupees(250),
    requiredDocuments: ['Aadhaar Copy', 'Age Proof', 'Address Proof', 'Passport-size Photo', 'Signature', 'Medical Certificate (Form 1A, if 40+ or commercial)'],
    formSchema: { fields: [
      F.fullName, F.fatherName, F.dob, F.gender, F.aadhaar,
      { name: 'vehicleClass', label: 'Vehicle Class', type: 'enum', options: ['two_wheeler_gearless', 'two_wheeler_with_gear', 'light_motor_vehicle', 'both_2w_and_lmv'], required: true },
      { name: 'bloodGroup', label: 'Blood Group', type: 'enum', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
      F.address, F.phone,
    ] },
  },
  {
    slug: 'driving-licence-renewal', name: 'Driving Licence – Renewal', category: 'Transport',
    description: 'Renew an expiring or expired driving licence. Renewal can be done up to 1 year before expiry; after a grace period of 30 days a late fee applies. Medical certificate (Form 1A) is required for applicants above 40 years.',
    feePaise: rupees(450),
    requiredDocuments: ['Existing Driving Licence', 'Aadhaar Copy', 'Address Proof', 'Passport-size Photo', 'Medical Certificate (Form 1A)'],
    formSchema: { fields: [
      { name: 'dlNumber', label: 'Driving Licence Number', type: 'string', required: true, min: 10, max: 20 },
      F.fullName, F.dob,
      { name: 'expiryDate', label: 'DL Expiry Date', type: 'date', required: true },
      F.phone,
    ] },
  },
  {
    slug: 'vehicle-rc-transfer', name: 'Vehicle RC – Ownership Transfer', category: 'Transport',
    description: 'Transfer ownership of a two-wheeler / four-wheeler after a sale or purchase. Form 29/30, insurance, PUC and Form 35 (if hypothecated) are required. Both seller and buyer details are needed.',
    feePaise: rupees(500),
    requiredDocuments: ['Original RC', 'Form 29 & 30 (signed)', 'Insurance Copy', 'PUC Certificate', 'Buyer Aadhaar Copy', 'Seller Aadhaar Copy', 'Form 35 / NOC (if loan)'],
    formSchema: { fields: [
      { name: 'vehicleNumber', label: 'Vehicle Registration Number', type: 'string', required: true, min: 6, max: 12 },
      { name: 'sellerName', label: "Seller's Full Name", type: 'string', required: true, min: 2, max: 100 },
      { name: 'buyerName', label: "Buyer's Full Name", type: 'string', required: true, min: 2, max: 100 },
      { name: 'saleDate', label: 'Date of Sale', type: 'date', required: true },
      { name: 'salePrice', label: 'Sale Price (INR)', type: 'number', required: true },
      F.phone,
    ] },
  },
  {
    slug: 'traffic-challan-payment', name: 'Traffic e-Challan Payment', category: 'Transport',
    description: 'Pay a pending traffic e-challan online by vehicle or challan number. Challan amount is payable in full; a small service charge applies. Payment receipt is provided instantly.',
    feePaise: rupees(10),
    requiredDocuments: [],
    formSchema: { fields: [
      { name: 'challanNumber', label: 'Challan Number', type: 'string', required: true, min: 4, max: 30 },
      { name: 'vehicleNumber', label: 'Vehicle Registration Number', type: 'string', required: true, min: 6, max: 12 },
      { name: 'amount', label: 'Challan Amount (INR)', type: 'number', required: true },
    ] },
  },

  // =====================================================================
  // BUSINESS & FINANCE
  // =====================================================================
  {
    slug: 'passport-fresh', name: 'Passport – Fresh Application (Seva Kendra Assistance)', category: 'Passport',
    description: 'Assistance for fresh passport application on the Passport Seva portal: form filling, document check and appointment booking at the nearest PSK/POPSK. Govt fee ₹1,500 (36 pages, normal) / ₹2,000 (60 pages); Tatkal extra ₹2,000. Police verification follows.',
    feePaise: rupees(1500),
    requiredDocuments: ['Aadhaar Copy', 'Date of Birth Proof', 'Address Proof', 'Passport-size Photos', 'Annexure documents as applicable (e.g. ECR/NECR proof)'],
    formSchema: { fields: [
      F.fullName, F.fatherName, F.dob, F.gender, F.aadhaar,
      { name: 'passportType', label: 'Application Type', type: 'enum', options: ['normal_36_pages', 'normal_60_pages', 'tatkal_36_pages', 'tatkal_60_pages'], required: true },
      { name: 'placeOfBirth', label: 'Place of Birth', type: 'string', required: true, min: 2, max: 100 },
      { name: 'maritalStatus', label: 'Marital Status', type: 'enum', options: ['single', 'married', 'divorced', 'widowed'], required: true },
      F.address, F.pincode, F.phone,
    ] },
  },
  {
    slug: 'udyam-registration', name: 'Udyam (MSME) Registration', category: 'Business',
    description: 'Free government registration for Micro, Small & Medium Enterprises on the Udyam portal. Gives an Udyam Registration Number and certificate, useful for loans, subsidies and tender benefits. Only PAN, Aadhaar and GSTIN (if applicable) are needed.',
    feePaise: rupees(100),
    requiredDocuments: ['Proprietor Aadhaar Copy', 'PAN Card Copy', 'Bank Passbook Copy', 'GSTIN (if available)'],
    formSchema: { fields: [
      F.aadhaar, F.fullName,
      { name: 'panNumber', label: 'PAN Number', type: 'string', required: true, min: 10, max: 10 },
      { name: 'enterpriseName', label: 'Name of Enterprise', type: 'string', required: true, min: 2, max: 150 },
      { name: 'enterpriseType', label: 'Type of Organisation', type: 'enum', options: ['proprietorship', 'partnership', 'llp', 'private_limited', 'other'], required: true },
      { name: 'activity', label: 'Major Activity', type: 'enum', options: ['manufacturing', 'services', 'trading'], required: true },
      { name: 'investment', label: 'Investment in Plant & Machinery (INR)', type: 'number', required: true },
      { name: 'employees', label: 'Number of Employees', type: 'number', required: true },
      F.phone,
    ] },
  },
  {
    slug: 'gst-registration', name: 'GST Registration', category: 'Business',
    description: 'New GST registration (REG-01) for businesses crossing the turnover threshold or opting voluntarily. ARN is generated on filing; GSTIN is issued after officer verification, usually in 3–7 working days. No government fee.',
    feePaise: rupees(500),
    requiredDocuments: ['PAN Card Copy', 'Aadhaar Copy', 'Passport-size Photo', 'Business Address Proof', 'Rent Agreement / Ownership Proof', 'Bank Passbook / Cancelled Cheque'],
    formSchema: { fields: [
      F.fullName,
      { name: 'panNumber', label: 'PAN Number', type: 'string', required: true, min: 10, max: 10 },
      { name: 'tradeName', label: 'Trade / Business Name', type: 'string', required: true, min: 2, max: 150 },
      { name: 'businessType', label: 'Constitution of Business', type: 'enum', options: ['proprietorship', 'partnership', 'llp', 'private_limited', 'other'], required: true },
      { name: 'expectedTurnover', label: 'Expected Annual Turnover (INR)', type: 'number', required: true },
      { name: 'businessAddress', label: 'Principal Place of Business', type: 'string', required: true, min: 10, max: 500 },
      F.phone,
    ] },
  },
  {
    slug: 'itr-filing', name: 'Income Tax Return (ITR) Filing', category: 'Business',
    description: 'File your income tax return for salaried individuals, pensioners and small businesses (ITR-1 to ITR-4). Includes Form 26AS / AIS check and e-verification. Due date for individuals not requiring audit is 31 July (extensions announced by CBDT).',
    feePaise: rupees(300),
    requiredDocuments: ['PAN Card Copy', 'Aadhaar Copy', 'Form 16', 'Bank Statement', 'Investment Proofs (80C, 80D etc.)', 'Interest Certificates'],
    formSchema: { fields: [
      F.fullName,
      { name: 'panNumber', label: 'PAN Number', type: 'string', required: true, min: 10, max: 10 },
      { name: 'assessmentYear', label: 'Assessment Year (e.g. 2026-27)', type: 'string', required: true, min: 7, max: 7 },
      { name: 'incomeSource', label: 'Main Source of Income', type: 'enum', options: ['salary', 'business', 'house_property', 'capital_gains', 'other'], required: true },
      { name: 'grossIncome', label: 'Approx. Gross Annual Income (INR)', type: 'number', required: true },
      { name: 'taxRegime', label: 'Tax Regime', type: 'enum', options: ['new', 'old'], required: true },
      F.phone,
    ] },
  },
  {
    slug: 'jan-dhan-account', name: 'Jan Dhan (PMJDY) Bank Account', category: 'Business',
    description: 'Open a zero-balance basic savings account under PMJDY with a RuPay debit card, ₹2 lakh accident insurance and overdraft facility (up to ₹10,000 after satisfactory operation). Account is opened at the partner bank branch / Bank Mitra.',
    feePaise: rupees(30),
    requiredDocuments: ['Aadhaar Copy', 'Passport-size Photo', 'Address Proof (if different from Aadhaar)'],
    formSchema: { fields: [
      F.aadhaar, F.fullName, F.fatherName, F.dob, F.gender,
      { name: 'nomineeName', label: 'Nominee Name', type: 'string', required: true, min: 2, max: 100 },
      { name: 'nomineeRelation', label: 'Nominee Relation', type: 'string', required: true, min: 2, max: 50 },
      F.address, F.phone,
    ] },
  },

  // =====================================================================
  // BILL PAYMENTS
  // =====================================================================
  {
    slug: 'electricity-bill-payment', name: 'Electricity Bill Payment', category: 'Bill Payments',
    description: 'Pay electricity bills for any DISCOM (instant).', feePaise: rupees(5),
    requiredDocuments: [],
    formSchema: { fields: [
      { name: 'consumerNumber', label: 'Consumer Number', type: 'string', required: true, min: 4, max: 30 },
      { name: 'provider', label: 'Provider', type: 'string', required: true, min: 2, max: 80 },
      { name: 'amount', label: 'Amount (INR)', type: 'number', required: true },
    ] },
  },
  {
    slug: 'water-bill-payment', name: 'Water Bill Payment', category: 'Bill Payments',
    description: 'Pay municipal / Jal Nigam water supply bills instantly. Keep your consumer or connection number handy. Receipt is generated immediately.',
    feePaise: rupees(5),
    requiredDocuments: [],
    formSchema: { fields: [
      { name: 'connectionNumber', label: 'Consumer / Connection Number', type: 'string', required: true, min: 4, max: 30 },
      { name: 'board', label: 'Water Board / Municipal Corporation', type: 'string', required: true, min: 2, max: 100 },
      { name: 'amount', label: 'Amount (INR)', type: 'number', required: true },
    ] },
  },
  {
    slug: 'property-tax-payment', name: 'Property Tax Payment', category: 'Bill Payments',
    description: 'Pay municipal property tax (house tax / water tax / sanitation tax) to your local body. Early-payment rebates may apply, and interest is charged on arrears as per the municipal corporation.',
    feePaise: rupees(10),
    requiredDocuments: ['Previous Tax Receipt (optional)'],
    formSchema: { fields: [
      { name: 'propertyId', label: 'Property ID / Assessment Number', type: 'string', required: true, min: 4, max: 40 },
      { name: 'ownerName', label: "Owner's Name", type: 'string', required: true, min: 2, max: 100 },
      { name: 'municipality', label: 'Municipal Corporation / Council', type: 'string', required: true, min: 2, max: 100 },
      { name: 'financialYear', label: 'Financial Year (e.g. 2026-27)', type: 'string', required: true, min: 7, max: 7 },
      { name: 'amount', label: 'Amount (INR)', type: 'number', required: true },
    ] },
  },
  {
    slug: 'lpg-cylinder-booking', name: 'LPG Cylinder Booking', category: 'Bill Payments',
    description: 'Book a refill for your LPG cylinder with Indane, Bharat Gas or HP Gas. Delivery is arranged by your distributor within 24–48 hours. Subsidy (if applicable) is credited directly to your bank account.',
    feePaise: rupees(10),
    requiredDocuments: [],
    formSchema: { fields: [
      { name: 'lpgProvider', label: 'Gas Company', type: 'enum', options: ['indane', 'bharat_gas', 'hp_gas'], required: true },
      { name: 'lpgId', label: '17-digit LPG ID / Consumer Number', type: 'string', required: true, min: 8, max: 17 },
      { name: 'distributor', label: 'Distributor Name', type: 'string', required: true, min: 2, max: 100 },
      F.phone,
    ] },
  },
  {
    slug: 'mobile-recharge', name: 'Mobile Recharge / Postpaid Bill', category: 'Bill Payments',
    description: 'Recharge a prepaid number or pay a postpaid bill for Jio, Airtel, Vi or BSNL. Instant credit in most cases.',
    feePaise: rupees(5),
    requiredDocuments: [],
    formSchema: { fields: [
      { name: 'operator', label: 'Operator', type: 'enum', options: ['jio', 'airtel', 'vi', 'bsnl'], required: true },
      { name: 'connectionType', label: 'Connection Type', type: 'enum', options: ['prepaid', 'postpaid'], required: true },
      { name: 'mobileNumber', label: 'Mobile Number', type: 'phone', required: true },
      { name: 'amount', label: 'Recharge / Bill Amount (INR)', type: 'number', required: true },
    ] },
  },
];