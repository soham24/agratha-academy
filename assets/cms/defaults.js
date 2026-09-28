/* ═══════════════════════════════════════════
   DEFAULT CONTENT
   The website's content as it was before the admin panel existed.
   Used to seed the database, and as a fallback if it can't be reached.
   ═══════════════════════════════════════════ */

export const DEFAULT_SITE = {
  school_name: 'The Agratha Academy',
  school_tagline: 'CBSE Affiliated · Umbergaon',
  logo: 'assets/photos/agratha-academy-logo.png',
  nav: [
    { label: 'About', href: '#about' },
    { label: 'Academics', href: '#academics' },
    { label: 'Campus', href: '#campus' },
    { label: 'Activities', href: '#activities' },
    { label: 'Notices', href: '#notices' },
    { label: 'Disclosure', href: 'mandatory-public-disclosure.html', new_tab: true },
    { label: 'Admissions', href: '#contact', highlight: true },
  ],
  ticker_label: 'Notice',
  ticker_enabled: true,
  popup_enabled: true,
  footer_name: 'The Agratha Academy CBSE',
  footer_lines: [
    'CBSE Affiliation No. 430444 · School Code 11442',
    'Umbergaon, Dist. Valsad, Gujarat – 396170',
  ],
  footer_nav: [
    { label: 'About', href: '#about' },
    { label: 'Academics', href: '#academics' },
    { label: 'Activities', href: '#activities' },
    { label: 'Campus', href: '#campus' },
    { label: 'Notices', href: '#notices' },
    { label: 'Disclosure', href: 'mandatory-public-disclosure.html', new_tab: true },
    { label: 'Contact', href: '#contact' },
  ],
  motto: 'ज्ञानं परमं बलम्',
  motto_translation: 'Knowledge is Supreme Strength',
  footer_tagline: 'CBSE Affiliated · Umbergaon, Gujarat',
  copyright: '© {year} The Agratha Academy CBSE, Umbergaon. All rights reserved.',
  whatsapp: '',
  seo_title: 'The Agratha Academy | CBSE School in Umbergaon, Valsad',
  seo_description: 'The Agratha Academy is a CBSE school in Umbergaon, Valsad (Affiliation 430444), offering Nursery to Grade 12 on an 8-acre campus. Admissions enquiries welcome.',
};

export const DEFAULT_HOME_SECTIONS = [
  {
    type: 'hero', anchor: 'top', label: 'Hero banner',
    data: {
      tagline: 'ज्ञानं परमं बलम्  ·  Knowledge is Supreme Strength',
      heading: 'Shaping *Leaders*\nSince a Century.',
      subtitle: 'The Agratha Academy, Umbergaon — CBSE affiliated, 8-acre campus, and a culture of excellence shaped by academics, sports, arts, and timeless Indian values.',
      background: 'assets/photos/schoolfront.jpg',
      buttons: [
        { label: 'Call Admissions', href: 'tel:+919537331834', style: 'saffron' },
        { label: 'Discover the School', href: '#about', style: 'ghost' },
      ],
      badges: [
        { value: '100+', label: 'Years of Legacy' },
        { value: 'CBSE 430444', label: 'Affiliation No.' },
        { value: '8 Acres', label: 'Campus' },
      ],
    },
  },
  {
    type: 'stats', anchor: '', label: 'Numbers strip',
    data: {
      items: [
        { number: 100, suffix: '+', label: 'Years of Legacy' },
        { number: 8, suffix: '', label: 'Acre Campus' },
        { number: 27, suffix: '', label: 'Classrooms' },
        { number: 48, suffix: '', label: 'Faculty & Staff' },
        { number: 3, suffix: '', label: 'Science Labs' },
      ],
    },
  },
  {
    type: 'about', anchor: 'about', label: 'About',
    data: {
      kicker: 'Who We Are',
      heading: 'A Century of Learning.\n*A Future of Leaders.*',
      lead: "Founded in the spirit of holistic education, The Agratha Academy stands at the intersection of India's rich educational heritage and the demands of a rapidly evolving world.",
      body: 'Situated on an expansive 8-acre campus near the shores of Umbergaon, Gujarat, our institution has shaped young minds for over a century. Affiliated with the Central Board of Secondary Education (CBSE), we serve students from Nursery through Grd. 12 — offering a curriculum that balances academic rigour with cultural depth, physical education, and life skills.\n\nEvery child who walks through our gates is seen as an individual — with unique strengths, aspirations, and dreams. We build on those, guided by a dedicated faculty and an environment that reflects the best of modern pedagogy and timeless Indian values.',
      values: ['Individuality', 'Sincerity', 'Dignity', 'Equality', 'Empathy'],
      image: 'assets/photos/schoolfront.jpg',
      image_alt: 'The Agratha Academy campus entrance, Umbergaon',
      badge_small: 'Est.',
      badge_big: '1920s',
      badge_sub: 'Umbergaon, Gujarat',
    },
  },
  {
    type: 'vision', anchor: 'vision', label: 'Vision & mission',
    data: {
      kicker: 'Our Purpose',
      heading: 'Every day, every moment,\nevery student — *evolving leaders.*',
      description: "Agratha exists to spot each child's inner talents and capabilities, preparing students to move ahead in life as passionate, committed, competent, value-based individuals with defining leadership qualities.",
      cards: [
        { icon: 'layers', title: 'Vision', text: "To be a centre of excellence that nurtures India's future leaders — rooted in values, equipped with skills, and inspired to serve society with integrity." },
        { icon: 'shield', title: 'Mission', text: 'To nurture innate potential and shape students into responsible citizens with strong values, rooted in Indian culture and prepared for a rapidly evolving world.' },
        { icon: 'heart', title: 'Philosophy', text: 'Leaders are made, not born. We develop capable young people who can serve society with confidence, compassion, and an abiding sense of character and purpose.' },
      ],
    },
  },
  {
    type: 'leadership', anchor: 'leadership', label: 'Leadership',
    data: {
      blocks: [
        {
          layout: 'feature', photo: 'assets/photos/trusty.png', photo_position: '',
          name: 'Ishwarbhai Govanbhai Bari', role: 'Chairman & Trustee',
          kicker: 'Message from the Chairman',
          heading: 'Rooted in values,\n*ready for tomorrow.*',
          quote: '"This institution was built with the conviction that every child from this community deserves world-class education rooted in Indian values. That conviction has guided us for over a century, and it will guide us for centuries more."',
          body: "The Agratha Academy is the fulfilment of a long-held dream — that quality education, grounded in dharma and enriched by India's civilisational heritage, should be within reach of every child in this region.\n\nAs Chairman, I remain deeply committed to providing our students, teachers, and community with the resources, values, and vision needed to build a truly great institution — one that stands as a beacon for generations to come.",
        },
        {
          layout: 'member', photo: 'assets/photos/banikm.jpg', photo_position: '',
          name: 'Bankimbhai Shah', role: 'Committee Member', kicker: '', heading: '',
          quote: '"Every resource we invest in this school is an investment in the future of our community. We owe our children nothing less than the very best."',
          body: '',
        },
        {
          layout: 'member', photo: 'assets/photos/ulhas.jpg', photo_position: 'center 20%',
          name: 'Ulhasbhai Tandel (Adv.)', role: 'Committee Member', kicker: '', heading: '',
          quote: '"A just and well-governed institution builds not only scholars but citizens of integrity. That is the standard we uphold at The Agratha Academy."',
          body: '',
        },
        {
          layout: 'feature-reverse', photo: 'assets/photos/anahita-zubin-najmi-portrait.jpg', photo_position: '',
          name: 'Anahita Zubin Najmi', role: 'Chief Executive Officer',
          kicker: 'Message from the CEO',
          heading: 'Education is the\n*lighting of a fire.*',
          quote: "\"At The Agratha Academy, we believe that a child's formative years — when shaped with intention, care, and cultural grounding — lay the foundation for a lifetime of meaningful contribution to our nation and the world.\"",
          body: 'For over a century, our institution has stood as a beacon of learning in Umbergaon. We place every student at the heart of our work. Through differentiated instruction, a rich cultural programme, and a dedicated faculty, we strive to nurture not just academic excellence but the character, curiosity, and compassion that define a true leader.\n\nWe welcome families who share our belief that education encompasses the whole child — their intellect, their values, their creativity, and their spirit. Together, as a team, we build the leaders India needs tomorrow.',
        },
        {
          layout: 'compact', photo: 'assets/photos/principalvaishali.jpg', photo_position: '',
          name: 'Vaishali Milind Churi', role: 'Principal',
          kicker: 'From the Principal',
          heading: 'Every child deserves *a champion.*',
          quote: '"The Agratha Academy is not merely a place of learning — it is a place of becoming. I take immense pride in our teachers, our students, and the trust families place in us every single day."',
          body: '',
        },
      ],
    },
  },
  {
    type: 'notices', anchor: 'notices', label: 'Notice board',
    data: {
      kicker: 'Notice Board',
      heading: 'Latest *Announcements.*',
      intro: 'Circulars, events and important updates from the school office.',
      limit: 6,
      empty_text: 'No announcements right now. Please check back soon.',
    },
  },
  {
    type: 'academics', anchor: 'academics', label: 'Academics',
    data: {
      kicker: 'Academics',
      heading: 'Structured Learning from\n*Nursery to Grd. 12.*',
      intro: 'Our academic framework is designed for holistic development — with clear daily schedules, CBSE board alignment, and a consistent track record of outstanding results.',
      schedules: [
        { badge: 'Pre Primary', title: 'Nursery · Jr.Kg · Sr.Kg', days: 'Monday to Saturday', time: '8:20 am – 12:00 noon', note: 'Foundation years focused on play-based learning, language, early numeracy, and building confidence in a nurturing environment.', color: 'saffron' },
        { badge: 'Primary & Secondary', title: 'Grd. 1 to Grd. 12', days: 'Monday to Saturday', time: '8:15 am – 1:40 pm', note: 'Core CBSE subjects alongside co-curricular activities, with strong conceptual foundations and value education woven in.', color: 'maroon' },
      ],
      results_label: 'Board Results 2024–25',
      results: [
        { value: '34 / 34', label: 'Students Passed', note: 'Std. X · 100% Result' },
        { value: '21', label: 'Students Appeared', note: 'Std. XII Science' },
        { value: '16', label: 'Students Appeared', note: 'Std. XII Commerce' },
      ],
    },
  },
  {
    type: 'admissions', anchor: 'admissions', label: 'Admissions',
    data: {
      kicker: 'Admissions Open · 2025–26',
      heading: 'Begin the Journey\nat *Agratha.*',
      lead: 'Admissions are open from Nursery onwards, subject to availability and age eligibility. Our process is transparent — guided by an interactive assessment, document verification, and a genuine commitment to welcoming every child ready to grow.',
      age_label: 'Age Eligibility',
      ages: [
        { class: 'Nursery', age: '3 years' },
        { class: 'Jr. Kindergarten', age: '4 years' },
        { class: 'Sr. Kindergarten', age: '5 years' },
        { class: 'Primary (Std. I–VIII)', age: '6–13 years' },
        { class: 'Secondary (Std. IX–X)', age: '14–15 years' },
      ],
      age_note: 'Age calculated as of 31 May of the academic year.',
      process_label: 'Admission Process',
      steps: [
        { title: 'Interactive Interview', text: 'A guided session with parents and child to understand aspirations and fit.' },
        { title: 'Document Verification', text: 'Submission of legal ID proofs, birth certificate, and prior academic records.' },
        { title: 'Assessment', text: 'Evaluation on core subjects and co-curricular readiness tailored to the grade.' },
      ],
      cta_label: 'Speak with Admissions Office',
      cta_href: '#contact',
      badge: 'Enrolments Open for 2025–26',
      cards: [
        { icon: 'user', title: 'Nursery Admission', text: 'Child must complete 3 years by 31 May of the academic year. Early registration is strongly encouraged.' },
        { icon: 'document', title: 'Transfer Certificate', text: 'Required for students joining from another school. UDISE and pen number details needed where applicable.' },
        { icon: 'box', title: 'Documents Required', text: 'Birth certificate, Aadhar card, photographs, previous report card, caste certificate (if applicable), and parent Aadhar cards.' },
      ],
      hours: 'Mon – Sat  ·  9 am – 2 pm',
      phone: '+91 95373 31834',
    },
  },
  {
    type: 'testimonials', anchor: 'testimonials', label: 'Testimonials',
    data: {
      kicker: 'What Parents Say',
      heading: 'Voices from the\n*Agratha Community.*',
      subhead: 'Our greatest measure of success is the trust our families place in us — and the growth they witness in their children every single day.',
      featured_quote: '"Agratha Academy was the only school we applied to — not only for its reputation but also because as we walked through its doors, we immediately felt that it was a school that walked the talk. Its values were not plaques on a wall — they were actions that every single person within its walls demonstrated."',
      featured_name: 'Vikas Patil',
      featured_role: 'Parent · Agratha Academy',
      items: [
        { quote: "\"I think the school is constantly improving and introducing new teaching methods and programmes. I have noticed with my child's improvement in academics.\"", name: 'Jigisha Patel', role: 'Parent', stars: 5 },
        { quote: '"Such a supportive, nurturing and fun school. You have struck the right balance between being an educational place, an extended family, and an opportunity to explore and widen the horizons."', name: 'Pallavi Jounjal', role: 'Parent', stars: 5 },
        { quote: "\"Communication is excellent. Regular letters and text messaging keeps us informed about what's happening in school and how our child is performing.\"", name: 'Rakesh Prajapati', role: 'Parent', stars: 5 },
      ],
    },
  },
  {
    type: 'activities', anchor: 'activities', label: 'Activities',
    data: {
      kicker: 'Co-Curricular',
      heading: 'Beyond the Classroom:\n*A Life Fully Lived.*',
      intro: "At Agratha, education happens everywhere — on the sports field, in the cultural hall, at sunrise yoga, and in the joyful camaraderie of India's great festivals.",
      items: [
        { image: 'assets/newgallery/school-morning-assembly-full-campus.jpg', alt: 'Full campus morning assembly', title: 'Morning Assembly', text: 'Every school day begins with a full campus assembly — instilling discipline, unity, and a sense of shared purpose.' },
        { image: 'assets/newgallery/nursery-kids-with-teachers.jpg', alt: 'Nursery children with their teachers', title: 'Nursery & Pre-Primary', text: 'Our youngest learners thrive in a warm, nurturing environment guided by caring and dedicated teachers.' },
        { image: 'assets/newgallery/navratri-celebration-gift-distribution.jpg', alt: 'Navratri celebration with gift distribution', title: 'Navratri Celebration', text: 'Navratri brings colour, dance, and community spirit — students and staff celebrate with traditional fervour.' },
        { image: 'assets/newgallery/onam-celebration-krishna-floral-rangoli.jpg', alt: 'Onam floral rangoli with Krishna statue', title: 'Onam & Floral Rangoli', text: "Vibrant floral rangolis and cultural displays mark Onam — connecting students to India's diverse traditions." },
        { image: 'assets/newgallery/students-atrium-school-event.jpg', alt: 'Students gathered for a school event in the atrium', title: 'School Events', text: 'From inter-house competitions to cultural days, our atrium comes alive with the energy of student life.' },
        { image: 'assets/newgallery/dance-team-group-photo-white-costumes.jpg', alt: 'School dance team in white costumes', title: 'Dance & Performing Arts', text: 'Our trained dance ensembles perform at school events and competitions, building confidence and artistic expression.' },
        { image: 'assets/newgallery/ndrf-disaster-preparedness-demo.jpg', alt: 'NDRF disaster preparedness demonstration', title: 'Safety & Awareness', text: 'NDRF officers conduct hands-on disaster preparedness sessions, equipping students with life-saving knowledge.' },
        { image: 'assets/newgallery/staff-group-photo-traditional-attire.jpg', alt: 'School staff in colourful traditional attire', title: 'Cultural Dress Days', text: "Staff unite in vibrant traditional attire, celebrating India's rich textile heritage and regional diversity." },
        { image: 'assets/newgallery/staff-guests-school-corridor.jpg', alt: 'Staff and guests on school campus', title: 'Guest Interactions', text: 'Distinguished visitors and community leaders regularly engage with our students and staff on campus.' },
        { image: 'assets/newgallery/christmas-celebration-students-santa-costumes.jpg', alt: 'Students dressed as Santa for Christmas', title: 'Christmas Celebration', text: 'Students dressed as Santa Claus take the stage in a joyful celebration of the season and the spirit of giving.' },
        { image: 'assets/newgallery/christmas-celebration-santa-group-photo.jpg', alt: 'Christmas Santa group photo with students', title: 'Christmas Group Photo', text: 'Students and staff embrace the festive season with enthusiasm, making memories that last a lifetime.' },
        { image: 'assets/newgallery/christmas-staff-santa-celebration.jpg', alt: 'Teachers celebrating Christmas in Santa costumes', title: 'Staff Christmas Fun', text: 'A joyful faculty is the heart of a great school — our staff celebrate every occasion with warmth and laughter.' },
      ],
    },
  },
  {
    type: 'campus', anchor: 'campus', label: 'Campus',
    data: {
      kicker: 'Campus',
      heading: 'Purposeful Spaces for\n*Learning by Doing.*',
      intro: 'The Agratha campus supports academic, scientific, digital, cultural, and physical education through dedicated facilities across 8 acres near the Umbergaon shoreline.',
      photos: [
        { image: 'assets/photos/students-in-science-laboratory.jpg', alt: 'Students working in the science laboratory' },
        { image: 'assets/photos/school-guests-welcome-outdoors.jpg', alt: 'Campus outdoor area with guests' },
      ],
      facts: [
        { icon: 'flask', title: '3 Science Labs', text: 'Physics, Chemistry, and Biology labs with full practical apparatus for CBSE board-level experiments.' },
        { icon: 'monitor', title: 'Computer Laboratory', text: 'Digital learning with internet access for technology education and 21st-century digital literacy skills.' },
        { icon: 'book', title: 'Library', text: 'A curated collection of textbooks, reference books, and reading materials accessible to all students.' },
        { icon: 'clock', title: 'Sports Grounds', text: 'Cricket pitch, skating rink, yoga grounds, and open fields for physical education and inter-school events.' },
        { icon: 'wifi', title: 'Internet & CCTV', text: 'High-speed internet campus-wide with full CCTV surveillance ensuring a safe and monitored environment.' },
        { icon: 'home', title: '27 Classrooms', text: 'Spacious, well-lit classrooms designed for focused learning with appropriate student-to-teacher ratios.' },
      ],
    },
  },
  {
    type: 'cta', anchor: 'disclosure', label: 'Disclosure banner',
    data: {
      kicker: 'CBSE Compliance',
      heading: 'Mandatory Public Disclosure',
      text: 'All school documents, staff details, infrastructure data, and board results — published as per CBSE Affiliation Bye-Laws (Appendix IX).',
      button_label: 'View Full Disclosure Page',
      button_href: 'mandatory-public-disclosure.html',
      new_tab: true,
    },
  },
  {
    type: 'contact', anchor: 'contact', label: 'Contact',
    data: {
      kicker: 'Get in Touch',
      heading: "We'd Love to Welcome\nYour Child to *Agratha.*",
      text: 'Our admissions office is open Monday through Saturday. Come visit, call, or write — we are here to guide you through every step of the admissions journey with care.',
      address: 'M.M High School Compound, Behind Police Station,\nUmbergaon – 396170, Dist. Valsad, Gujarat, India',
      buttons: [
        { icon: 'phone', label: 'Primary Number', value: '9537331834', href: 'tel:+919537331834', primary: true },
        { icon: 'phone', label: 'Alternate Number', value: '9545611177', href: 'tel:+919545611177' },
        { icon: 'mail', label: 'Email Us', value: 'anahitanajmi@gmail.com', href: 'mailto:anahitanajmi@gmail.com' },
        { icon: 'map', label: 'Find Us', value: 'Open in Maps', href: 'https://www.google.com/maps/search/?api=1&query=The%20Agratha%20Academy%20Umbergaon%20Valsad%20Gujarat' },
      ],
      map_embed: '',
    },
  },
];

// ── Disclosure page ──────────────────────────────────────────────
export const DEFAULT_DISCLOSURE = {
  brand_line: 'The Agratha Academy CBSE  ·  Umbergaon, Gujarat',
  badge: 'CBSE Affiliation Bye-Laws — Appendix IX',
  title: 'Mandatory Public Disclosure',
  intro: 'All information published on this page is in compliance with CBSE norms.\nThis page is publicly accessible without login, as required.',
  updated: 'May 2026',
  sidebar_title: 'CBSE Compliance',
  sidebar_text: 'This Mandatory Public Disclosure is published as per CBSE Affiliation Bye-Laws and is updated periodically. For queries, contact the school office.',
  footer: '**The Agratha Academy CBSE**\nCBSE Affiliation No. 430444 · School Code 11442\nM.M High School Compound, Behind Police Station, Umbergaon – 396170, Dist. Valsad, Gujarat\n[+91 9537331834](tel:+919537331834)  ·  [anahitanajmi@gmail.com](mailto:anahitanajmi@gmail.com)\n\n[← Back to Main Website](index.html)  ·  This disclosure page is maintained as per CBSE Affiliation Bye-Laws (Appendix IX).',
};

const PGT = 'PGT', TGT = 'TGT', PRT = 'PRT';
const staff = [
  ['Foram Sukani', 'M.Sc, B.Ed', PGT], ['Prachi Rahul Pingale', 'BE Computer', PGT],
  ['Shikha Ashish Sharma', 'M.Com', PGT], ['Niharranjan Nayak', 'M.Sc, B.Ed', PGT],
  ['Nikita Vinesh Patel', 'M.Com, B.Ed', PGT], ['Rahul Jignesh Bhavsar', 'M.Sc, B.Ed', PGT],
  ['Aasma Shaikh', 'M.Com, B.Ed', PGT], ['Vaishali Churi', 'MA, B.Ed', PGT],
  ['Sweta Patel', 'MA, B.Ed', PGT], ['Imrana M.D. Karim Siddique', 'M.Sc, B.Ed', PGT],
  ['Vanchita Mayavanshi', 'B.Sc, B.Ed', PGT], ['Nirali J. Bhavsar', 'M.Sc, B.Ed', PGT],
  ['Akanksha Saxena', 'BA, B.Ed', TGT], ['Saurabh Vijay Yadav', 'BMS, B.Ed', TGT],
  ['Priti Ranjit Pal', 'B.Sc, B.Ed', TGT], ['Ruhi Kamble', 'B.Com, B.Ed', TGT],
  ['Shalan Kale', 'B.Sc, B.Ed', TGT], ['Amarpreet C. Mullick', 'HSC, ECCEd', TGT],
  ['Durvisha Makvana', 'MA', TGT], ['Purnima Rakesh Dave', 'MA', PRT],
  ['Samiksha Anant Padad', 'M.Com', PRT], ['Nikita Gupta', 'B.Com, ECCEd', PRT],
  ['Anchal Shrikant Pande', 'HSC, D.Ed', PRT], ['Khyati Nishit Shah', 'B.Com', PRT],
  ['Sunanda Ranjit Jadav', 'BA, ECCEd', PRT], ['Sarita Jaiswal', 'BA', PRT],
  ['Shyamrao Dubla', 'HSC', PRT], ['Kinjal Rajeshbhai Bariya', 'M.Com', 'Admin'],
  ['Amisha L. Mahyavanshi', 'M.Com', 'Admin'], ['Neha M. Kamli', 'HSC', 'Support'],
  ['Eram Banu Siddique', 'M.Com', 'Teacher'], ['Suniya Bhojani', 'B.Com', 'Teacher'],
  ['Alima Mazaniya', 'BA', 'Teacher'], ['Nilu Rai', 'B.Com', 'Teacher'],
  ['Ditiksha Surti', 'B.Com, B.Ed', 'Teacher'], ['Dhruvi Bhandari', 'M.Sc', 'Teacher'],
  ['Shivangi Surti', 'HSC', 'Teacher'], ['Anjali Gore', 'BA', 'Teacher'],
  ['Uma Singh', 'BA', 'Teacher'], ['Radhika Gupta', 'HSC', 'Teacher'],
  ['Kinjal Solanki', 'B.Com, B.Ed', 'Teacher'], ['Saloni Mahyavanshi', 'M.Com', 'Teacher'],
  ['Kamini Bhandari', 'B.Ed', 'Teacher'], ['Prachi Baria', 'MA, B.Ed', 'Teacher'],
  ['Akash Bhoye', 'Part-time', 'Part-time'], ['Rinkal Mistry', 'ECCEd', 'Teacher'],
  ['Divyata Panchal', 'B.Com, B.Ed', 'Teacher'], ['Shyam Naidu', 'Part-time', 'Part-time'],
].map(([name, qualification, role]) => ({ name, qualification, role }));

const pdf = (label, url) => ({ label, url });

export const DEFAULT_DISCLOSURE_SECTIONS = [
  {
    type: 'disc_info', anchor: 'general-info', label: 'General Information',
    data: {
      title: 'General Information',
      subtitle: 'Basic school identification and contact details',
      rows: [
        { label: 'School Name', value: 'The Agratha Academy CBSE', highlight: true },
        { label: 'CBSE Affiliation Number', value: '430444', highlight: true },
        { label: 'School Code', value: '11442', highlight: true },
        { label: 'Type of Affiliation', value: 'CBSE (Central Board of Secondary Education)' },
        { label: 'Principal Name', value: 'Vaishali Milind Churi' },
        { label: 'CEO / Manager', value: 'Anahita Zubin Najmi' },
        { label: 'Chairman / Trustee', value: 'Ishwarbhai Govanbhai Bari' },
        { label: 'School Email', value: '[anahitanajmi@gmail.com](mailto:anahitanajmi@gmail.com)' },
        { label: 'Contact Numbers', value: '[+91 9537331834](tel:+919537331834)  /  [+91 9545611177](tel:+919545611177)' },
        { label: 'School Address', value: 'M.M High School Compound, Behind Police Station,\nUmbergaon – 396170, Dist. Valsad, Gujarat, India' },
        { label: 'Trust / Society Name', value: 'The Agratha Academy Trust' },
        { label: 'Website', value: '[theagrathaacademy.in](index.html)' },
        { label: 'Classes Offered', value: 'Nursery to Std. X (CBSE)' },
        { label: 'Medium of Instruction', value: 'English' },
        { label: 'School Category', value: 'Co-educational, Day School' },
      ],
    },
  },
  {
    type: 'disc_documents', anchor: 'documents', label: 'Documents',
    data: {
      title: 'Documents and Information',
      subtitle: 'Mandatory certificates and regulatory documents',
      items: [
        { icon: 'document', title: 'CBSE Affiliation Letter', text: 'Official affiliation status — No. 430444', files: [pdf('View PDF', 'assets/docs/cbse-affiliation-status-430444.pdf')] },
        { icon: 'document', title: 'CBSE Affiliation Status (Copy)', text: 'Secondary copy of affiliation certificate', files: [pdf('View PDF', 'assets/docs/cbse-affiliation-status-430444-copy.pdf')] },
        { icon: 'bookmark', title: 'Society / Trust Registration Certificate', text: 'State registration of the managing trust', files: [pdf('View PDF', 'assets/docs/trust_registration_optimized.pdf')] },
        { icon: 'document', title: 'School Recognition Letter (Std. 6–8)', text: 'State government recognition — Gujarati', files: [pdf('View PDF', 'assets/docs/school-recognition-letter-std-6-to-8-gujarati.pdf')] },
        { icon: 'home', title: 'Building Safety Certificate', text: 'Municipality building safety certification', files: [pdf('View PDF', 'assets/docs/building-safety-certificate.pdf')] },
        { icon: 'fire', title: 'Fire Safety Certificate', text: 'Fire NOC from competent authority', files: [pdf('Certificate 1', 'assets/docs/optimized_Fire Certificate.pdf'), pdf('Certificate 2', 'assets/docs/optimized_fire safety certificate.pdf')] },
        { icon: 'drop', title: 'Water, Health & Sanitation Certificate', text: 'Health department certification', files: [pdf('View PDF', 'assets/docs/Water_Health_Sanitation_Certificate_Optimized.pdf')] },
        { icon: 'land', title: 'Land / Property Certificate', text: 'Land ownership or lease document', files: [pdf('View PDF', 'assets/docs/Land_Certificate_Optimized_180dpi_q65.pdf')] },
        { icon: 'document', title: 'DEO / Collector NOC', text: 'No Objection Certificate from District Education Officer', files: [pdf('View PDF', 'assets/docs/NOC_Optimized.pdf')] },
        { icon: 'card', title: 'Fee Regulatory Committee Provisional Order', text: 'FRC order 2021–2024', files: [pdf('View PDF', 'assets/docs/fee-regulatory-committee-provisional-order-2021-to-2024.pdf')] },
        { icon: 'badge', title: 'Income Tax 12AA Registration Notice', text: 'Tax registration document', files: [pdf('View PDF', 'assets/docs/income-tax-12aa-registration-notice.pdf')] },
        { icon: 'copy', title: 'Academic Calendar 2026–27', text: 'Annual academic schedule and activities', files: [pdf('View PDF', 'assets/docs/Academic_Calendar_2026_27_FULL.pdf')] },
      ],
    },
  },
  {
    type: 'disc_results', anchor: 'results', label: 'Results & Academics',
    data: {
      title: 'Results and Academics',
      subtitle: 'Board examination results and academic performance — 2024–25',
      stats: [
        { value: '34', label: 'Std. X Appeared' },
        { value: '34', label: 'Std. X Passed' },
        { value: '100%', label: 'Std. X Pass Rate' },
        { value: '37', label: 'Std. XII Total' },
      ],
      rows: [
        { class: 'Std. X', stream: 'General', registered: '34', passed: '34', rate: '100%', year: '2024–25', highlight: true },
        { class: 'Std. XII', stream: 'Science', registered: '21', passed: '—', rate: '—', year: '2024–25' },
        { class: 'Std. XII', stream: 'Commerce', registered: '16', passed: '—', rate: '—', year: '2024–25' },
      ],
      note: '**Note:** Subject-wise performance data and topper details are available from the school office on request. CBSE results are also verifiable at [cbseresults.nic.in](https://cbseresults.nic.in).',
    },
  },
  {
    type: 'disc_staff', anchor: 'staff', label: 'Staff Details',
    data: {
      title: 'Staff Details',
      subtitle: 'Teaching and non-teaching staff composition',
      stats: [
        { value: '48', label: 'Total Staff' },
        { value: '12', label: 'PGT' },
        { value: '7', label: 'TGT' },
        { value: '8', label: 'PRT' },
        { value: '16', label: 'Teachers' },
        { value: '2', label: 'Part-time' },
        { value: '3', label: 'Admin / Support' },
        { value: 'MA / M.Sc', label: 'Postgraduate Qualifications' },
      ],
      principal_label: 'Principal',
      principals: [{ name: 'Vaishali Milind Churi', designation: 'Principal', qualification: 'MA, B.Ed' }],
      staff_label: 'Teaching Staff',
      staff,
    },
  },
  {
    type: 'disc_infra', anchor: 'infrastructure', label: 'Infrastructure',
    data: {
      title: 'School Infrastructure',
      subtitle: 'Campus facilities and physical resources',
      items: [
        { title: 'Total Campus Area', value: '8 Acres' },
        { title: 'Total Classrooms', value: '27 Classrooms' },
        { title: 'Science Laboratories', value: '3 Labs (Physics, Chemistry, Biology)' },
        { title: 'Computer Laboratory', value: '1 Lab — with internet access' },
        { title: 'Library', check: '✓ Available', value: 'Books & Reference Materials' },
        { title: 'Internet Facility', check: '✓ Available', value: 'Campus-wide' },
        { title: 'CCTV Surveillance', check: '✓ Installed', value: 'Full campus coverage' },
        { title: 'Sports Facility', value: 'Cricket, Skating, Yoga, Fitness grounds' },
        { title: 'Drinking Water', check: '✓ Available', value: 'Purified water supply' },
        { title: 'Toilet Blocks', value: 'Separate for Boys, Girls & Staff' },
        { title: 'Barrier-Free Access', value: 'Ramps and accessible facilities' },
        { title: 'Fire Extinguishers', check: '✓ Installed', value: 'As per safety norms' },
      ],
      rows: [
        { label: 'School Location Type', value: 'Urban — Umbergaon town, near shoreline' },
        { label: 'Transport Facility', value: 'Available for students on request' },
        { label: 'Medical Room', value: 'First-aid facility available on campus' },
        { label: 'Canteen / Tuck Shop', value: 'Available on campus' },
        { label: 'Auditorium / Hall', value: 'Available for assemblies and cultural events' },
      ],
    },
  },
];
