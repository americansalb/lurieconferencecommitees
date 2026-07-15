// Confirmed speakers shown in the landing "Featured Speakers" section.
// Curated by hand (not pulled from the presenter database) so the public
// lineup only ever shows people who have truly confirmed. Add a new entry as
// each speaker confirms; drop their headshot in /public/speakers/.
//
// `title` is kept to a single short line (the card shows it on one row);
// fuller role detail lives in the bio. `bio` is the full bio; the card
// shows a few lines and a "Read more" toggle reveals the rest.

export type Speaker = {
  slug: string;
  name: string;
  credentials?: string;
  title: string;
  org: string;
  bio: string;
  photo: string;
  // The title of their session, highlighted on the card when we have it
  // (quoted, above the role). Leave unset until the talk is confirmed.
  talk?: string;
  // The keynote gets the full-width feature treatment at the top of the
  // Speakers section instead of a card in the grid.
  keynote?: boolean;
};

export const SPEAKERS: Speaker[] = [
  {
    slug: "liz-even",
    name: "Elizabeth Even",
    title: "Senior Director, Field Operations",
    org: "The Joint Commission",
    talk: "The Standards That Protect Patients: A Joint Commission View on Language Access",
    keynote: true,
    bio: "Elizabeth Even is a nurse with over 20 years of clinical and leadership experience who currently serves as Senior Director of Field Operations for the Division of Accreditation and Certification Operations at The Joint Commission. In this role, she provides strategic and operational leadership for ACO field operations, including strategic planning, budgeting and financial management, workforce planning, talent acquisition and retention, employee engagement, education, and the execution of field-based programs and activities. Her work supports the organization’s strategic direction and advances consistent, high-quality, and customer-focused accreditation and certification operations.",
    photo: "/speakers/liz-even.webp",
  },
  {
    slug: "michael-mule",
    name: "Michael Mulé",
    title: "Civil Rights Attorney, Language Access Expert",
    org: "Formerly U.S. Department of Justice, Civil Rights Division",
    talk: "Lessons from DOJ’s Language Access Enforcement",
    bio: "Michael Mulé is a civil rights attorney with twenty years of experience advancing the rights of people who communicate in languages other than English. For fifteen years, he led national Title VI and language access initiatives at the U.S. Department of Justice (DOJ) in the Civil Rights Division (CRT) and the Office of Justice Programs.",
    photo: "/speakers/michael-mule.webp",
  },
  {
    slug: "danilo-formolo",
    name: "Danilo Formolo",
    credentials: "MBA, CHI™",
    title: "CEO & Founder",
    org: "Affinity Language Systems",
    talk: "Why Hospitals Still Get Language Access Wrong: The Uncomfortable Truth",
    bio: "Danilo Formolo is the CEO and Founder of Affinity Language Systems, an organization focused on building human and technology-enabled language access infrastructure. He serves as a CCHI Commissioner and treasurer, and spent 21 years building the largest healthcare-based language access program in the nation at Atrium Health. As Associate Vice President of Language Access, he created a large, scalable infrastructure through technology, efficiency, and strategy to improve access across four states with a team of nearly 200 medical interpreters. Danilo earned Bachelor’s degrees in Management and International Business from UNC Charlotte, plus an MBA. He has delivered industry conference presentations around the country, is a Certified Healthcare Interpreter, and has served on various community boards and initiatives. Of Colombian and Italian heritage, his first instrument is the piano, and he has served as an organist and music director at various churches in the Charlotte, NC area.",
    photo: "/speakers/danilo-formolo.webp",
  },
  {
    slug: "yuliya-speroff",
    name: "Yuliya Speroff",
    credentials: "CoreCHI-P™",
    title: "Medical Interpreter Supervisor",
    org: "Harborview Medical Center, Seattle",
    talk: "Promoting Health Equity Through Language Access: Case Study from Harborview Medical Center",
    bio: "Yuliya Speroff is a Russian–English CoreCHI-P™ and Washington DSHS-certified interpreter and Medical Interpreter Supervisor at Harborview Medical Center in Seattle, Washington. Yuliya has extensive experience as a trainer, teaching both continuing education courses and introductory medical interpreter training programs for major professional organizations across the United States. Her passion for advancing the medical interpreting profession is reflected in multiple roles: she is the author of medicalinterpreterblog.com and serves as vice president of the National Council on Interpreting in Healthcare (NCIHC). Her contributions have been recognized nationally. She was named Interpreter of the Year by the California Healthcare Interpreting Association (CHIA) in 2021 and Trainer of the Year by Americans Against Language Barriers (AALB) in 2024.",
    photo: "/speakers/yuliya-speroff.webp",
  },
  {
    slug: "yuri-takabatake",
    name: "Yuri Takabatake",
    credentials: "MD",
    title: "Attending Physician",
    org: "Lurie Children’s Hospital of Chicago",
    talk: "Advancing Language Access Through Interprofessional Collaboration: The Language Access & Care Committee",
    bio: "Dr. Yuri Takabatake is an attending physician within the Division of Hospital-Based Medicine at Ann & Robert H. Lurie Children’s Hospital of Chicago. She is a language equity researcher and advocate, and has published on topics such as interpreter partnership during family-centered rounds. She is also the co-founder and co-director of Lurie Children’s Language Access and Care Committee.",
    photo: "/speakers/yuri-takabatake.webp",
  },
  {
    slug: "marisa-rueda-will",
    name: "Marisa Rueda Will",
    credentials: "CHI™-Spanish",
    title: "Founder & Lead Trainer",
    org: "Tica Interpreter Training & Translations",
    talk: "Speak Up: Using Front-Line Experience to Shape Federal Policy",
    bio: "Marisa Rueda Will is a veteran medical interpreter and trainer with over 18 years of experience at Mayo Clinic, where she rose to Level III and served as a Simulation Center Instructor. A certified Spanish healthcare interpreter (CHI™-Spanish) and Licensed Interpreter Trainer, Marisa holds a degree from Luther College and recently completed her Master’s in Interpreting Studies at Western Oregon University. She is actively involved in the industry, serving on the NCIHC Webinars Work Group and as a CCHI Commissioner, and presenting at major national conferences including ATA, CHIA, and CCHI. Today, she owns Tica Interpreter Training and Translations, where she specializes in education through storytelling, delivering professional training rooted in real patient experiences.",
    photo: "/speakers/marisa-rueda-will.webp",
  },
  {
    slug: "wilma-alvarado-little",
    name: "Wilma Alvarado-Little",
    title: "Associate Commissioner",
    org: "New York State Department of Health",
    talk: "Empowering Communication: Lessons from Language Access Past, Present, and Future",
    bio: "Ms. Alvarado-Little has focused on racial and health equity from a linguistic and cultural perspective, alongside interests in public policy, research, health literacy, and health disparities prevention. As Associate Commissioner and Director of the Office of Minority Health and Health Disparities Prevention at the New York State Department of Health, she leads health literacy and language access initiatives and has been instrumental in developing and implementing hospital- and clinic-based programs and policy. As former co-chair of the board of the National Council on Interpreting in Health Care (NCIHC), she helped the Council achieve the first National Certification for healthcare interpreters, the National Standards of Practice, and the National Code of Ethics. She serves on the HHS Office of Minority Health’s National Project Advisory Committee for the review of the CLAS Standards, has served on the National Academies’ Roundtable on Health Literacy, and chaired the New York State Office of Mental Health Multicultural Advisory Committee. With more than 40 years of experience, she has been a strong voice for linguistically appropriate healthcare at the national, state, and local levels, participating in efforts led by the Joint Commission, the American Medical Association, and the HHS Office of Minority Health. Prior to becoming an independent consultant, she and SUNY colleagues received a 2009 National Institutes of Health grant supporting the Center for the Elimination of Minority Health Disparities at the University at Albany, SUNY, where she served as PI and Director of Community Engagement and Outreach.",
    photo: "/speakers/wilma-alvarado-little.webp",
  },
  {
    slug: "daniel-gutierrez-mena",
    name: "Daniel Gutiérrez Mena",
    title: "Medical Interpreter & Health Educator",
    org: "Rush University Medical Center",
    talk: "The Mindful Interpreter: Building Resilience, Deep Listening, and Trauma Stewardship in Medical Interpreting",
    bio: "Daniel Gutiérrez Mena, founder of AlbaHealth.us, blends yoga, mindfulness, and global healthcare experience to create transformative wellness education that connects individuals to their physical, mental, and spiritual dimensions. From his journey immigrating from Lima to Chicago to his work across clinical care, research, and health innovation, he integrates modern science with indigenous wisdom to help others rediscover their relationship with health and the Earth.",
    photo: "/speakers/daniel-gutierrez-mena.webp",
  },
  {
    slug: "patricia-alonzo",
    name: "Patricia A. Alonzo",
    credentials: "EdD",
    title: "Director of Strategic Partnerships",
    org: "Equiti Health",
    talk: "The Persistent Gap Between Policy, Practice, and Professional Medical Interpreting",
    bio: "Dr. Patricia A. Alonzo is a trilingual medical interpreter (English, Spanish, and ASL) with a Bachelor’s in ASL Interpreting, a Master’s in Educational Leadership, and an EdD in Organizational Leadership focused on the health outcomes of Limited English Proficient patients in healthcare settings. Currently Director of Strategic Partnerships at Equiti Health, she combines interpreting expertise with strategic leadership. Her interpreting career began in Chicago as a trilingual freelance interpreter and continued at Moffitt Cancer Center, providing critical language services to LEP patients. During her decade at Stratus/AMN Healthcare she grew through a range of roles, and as VP of Language Operations at Universal Language Services she led the organization through transformational growth. Dr. Alonzo holds CMI national certification and frequently speaks on language access, cultural competency, and legislation.",
    photo: "/speakers/patricia-alonzo.webp",
  },
  {
    slug: "hugo-juarez",
    name: "Hugo Juarez",
    title: "Certified Medical Interpreter (Spanish)",
    org: "Staff interpreter — pediatric & adult Level 1 trauma centers",
    talk: "Beyond Accuracy: The Invisible Skills in Healthcare Interpreting",
    bio: "Hugo Juarez is a certified Spanish medical interpreter who has worked as a staff interpreter in both pediatric and adult hospitals for over 15 years. His experience at adult and pediatric Level 1 Trauma Centers and teaching hospitals in a major U.S. city has allowed him to serve patients and families of diverse backgrounds across a wide range of clinical settings. His Day 1 session names the practices interpreters routinely use to bridge the gap between accurate interpretation and effective communication — the work ethical guidelines from the NCIHC and IMIA make room for but never give a vocabulary — and explores how those practices adapt to remote interpreting.",
    photo: "/speakers/hugo-juarez.webp",
  },
  {
    slug: "mercedes-marti",
    name: "Mercedes Marti",
    title: "Certified Medical Interpreter (Spanish)",
    org: "Nationally ranked pediatric hospital, Chicago",
    talk: "Beyond Accuracy: The Invisible Skills in Healthcare Interpreting",
    bio: "Mercedes Marti is a certified Spanish medical interpreter working at a nationally ranked pediatric hospital in Chicago. She holds a BS in Community Health & American Studies from Tufts University. Her Day 1 session identifies and names the invisible practices in-person interpreters use every day to turn accurate interpretation into effective communication — and explores how those practices carry over to remote interpretation.",
    photo: "/speakers/mercedes-marti.webp",
  },
  {
    slug: "sarah-stockler-rex",
    name: "Sarah Stockler-Rex",
    credentials: "MA, CHI™-Spanish",
    title: "Director of Curriculum Development & Testing Administration",
    org: "Equiti Health",
    talk: "Elevating the Role of Healthcare Interpreters: Contributing to Positive Health Outcomes",
    bio: "Sarah Stockler-Rex has worked as a Spanish medical interpreter, in both onsite and remote modalities, for 15 years. She currently oversees Equiti’s Training & Testing Department: a team dedicated to continuous interpreter skill development and upholding the standards of the profession. A strong believer that skills maintenance is key for interpreters in leadership positions, she still regularly interprets within her local Columbus, Ohio community. Sarah holds a Bachelor of Arts in Spanish and Linguistics and a Master of Arts in Applied Linguistics with a specialization in Language Testing. She is a proud co-author of the highly acclaimed, first-of-its-kind textbook The Remote Interpreter: Volume I: Foundations in Remote Interpreting (Cross-Cultural Communications, 2023). One language-related life goal: dispelling the prescriptivist myth that any one language variety is superior to another.",
    photo: "/speakers/sarah-stockler-rex.webp",
  },
  {
    slug: "tatiana-cestari",
    name: "Tatiana González-Cestari",
    credentials: "PhD, CHI™-Spanish",
    title: "Director of Language Service Advocacy",
    org: "Martti, an Equiti Solution",
    talk: "Elevating the Role of Healthcare Interpreters: Contributing to Positive Health Outcomes",
    bio: "Dr. Tatiana González-Cestari has 23 years of combined experience as a pharmacologist, researcher, professor, leader, and remote interpreter. She is the Director of Language Service Advocacy at Equiti, where she focuses on hospitals’ language access best practices and their impact on quality, compliance, and financial metrics. Tatiana serves on the NCIHC board and its Policy, Education and Research Committee, and is a co-author of The Remote Interpreter textbook. She has mentored interpreters, developed training, presented at national and international events, published peer-reviewed and non-peer-reviewed articles, and lectured at various universities. She earned her pharmacy degree and her PhD in pharmacology from Universidad Central de Venezuela.",
    photo: "/speakers/tatiana-cestari.webp",
  },
  {
    slug: "jane-kontrimas",
    name: "Jane Crandall Kontrimas",
    credentials: "CoreCHI™, MS",
    title: "National Ethics and Standards Work Group Chair",
    org: "National Council on Interpreting in Health Care",
    talk: "Revising the National Code of Ethics for Interpreters in Health Care: What’s New?",
    bio: "Jane Crandall Kontrimas worked as a Russian interpreter from 1978 to 2025. She was a founding member of the Massachusetts Medical Interpreter Association (MMIA), now the International Medical Interpreter Association (IMIA), and chaired its Standards of Practice Committee while the Standards of Practice for Medical Interpreters (1996) was written. She co-wrote Interpreter Advocacy in Healthcare Encounters: A Closer Look with the National Standards of Practice Work Group of the National Council on Interpreting in Health Care (NCIHC), and currently chairs the NCIHC National Ethics and Standards Work Group revising the Code of Ethics for Interpreters in Health Care. She has expressed her passion for interpreting by training interpreters, medical students and faculty, and social workers. Her Day 2 workshop puts outcome-based ethical reasoning to work on real case scenarios.",
    photo: "/speakers/jane-kontrimas.webp",
  },
  {
    slug: "linda-coronado",
    name: "Linda G. Coronado",
    title: "Pioneer of Hospital Interpreter Services",
    org: "Stroger Hospital of Cook County · Day 1 Panelist",
    bio: "Linda G. Coronado spent 21 years at the Stroger Hospital of Cook County, where she was responsible for developing the first hospital-based interpreter services in Cook County (1984–2005), and went on to help create the Language Access Resource Center (LARC) in DuPage County. As an instructor at the City Colleges of Chicago, she facilitated the first — and only — medical interpreter training program at the college level. Her civic leadership runs just as deep: she served as member and chairperson of the Mayor’s Advisory Commission on Latino Affairs during the Harold Washington administration, co-convenes the 7th Cook County District Health Task Force, serves on the Board of Directors of the Brighton Park Neighborhood Council, and is an active member of the Peace and Education Coalition in the Back of the Yards — the neighborhood where she has lived her whole life. She holds a Bachelor’s in Spanish Secondary Education from Northeastern Illinois University and a Master’s from Roosevelt University.",
    photo: "/speakers/linda-coronado.webp",
  },

];
