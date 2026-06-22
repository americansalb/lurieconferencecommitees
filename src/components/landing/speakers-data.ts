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
};

export const SPEAKERS: Speaker[] = [
  {
    slug: "yuri-takabatake",
    name: "Yuri Takabatake",
    credentials: "MD",
    title: "Attending Physician",
    org: "Lurie Children’s Hospital of Chicago",
    bio: "Dr. Yuri Takabatake is an attending physician within the Division of Hospital-Based Medicine at Ann & Robert H. Lurie Children’s Hospital of Chicago. She is a language equity researcher and advocate, and has published on topics such as interpreter partnership during family-centered rounds. She is also the co-founder and co-director of Lurie Children’s Language Access and Care Committee.",
    photo: "/speakers/yuri-takabatake.webp",
  },
  {
    slug: "yuliya-speroff",
    name: "Yuliya Speroff",
    credentials: "CoreCHI-P™",
    title: "Medical Interpreter Supervisor",
    org: "Harborview Medical Center, Seattle",
    bio: "Yuliya Speroff is a Russian–English CoreCHI-P™ and Washington DSHS-certified interpreter and Medical Interpreter Supervisor at Harborview Medical Center in Seattle, Washington. Yuliya has extensive experience as a trainer, teaching both continuing education courses and introductory medical interpreter training programs for major professional organizations across the United States. Her passion for advancing the medical interpreting profession is reflected in multiple roles: she is the author of medicalinterpreterblog.com and serves as vice president of the National Council on Interpreting in Healthcare (NCIHC). Her contributions have been recognized nationally. She was named Interpreter of the Year by the California Healthcare Interpreting Association (CHIA) in 2021 and Trainer of the Year by Americans Against Language Barriers (AALB) in 2024.",
    photo: "/speakers/yuliya-speroff.webp",
  },
  {
    slug: "wilma-alvarado-little",
    name: "Wilma Alvarado-Little",
    title: "Associate Commissioner",
    org: "New York State Department of Health",
    bio: "Ms. Alvarado-Little has focused on racial and health equity from a linguistic and cultural perspective, alongside interests in public policy, research, health literacy, and health disparities prevention. As Associate Commissioner and Director of the Office of Minority Health and Health Disparities Prevention at the New York State Department of Health, she leads health literacy and language access initiatives and has been instrumental in developing and implementing hospital- and clinic-based programs and policy. As former co-chair of the board of the National Council on Interpreting in Health Care (NCIHC), she helped the Council achieve the first National Certification for healthcare interpreters, the National Standards of Practice, and the National Code of Ethics. She serves on the HHS Office of Minority Health’s National Project Advisory Committee for the review of the CLAS Standards, has served on the National Academies’ Roundtable on Health Literacy, and chaired the New York State Office of Mental Health Multicultural Advisory Committee. With more than 40 years of experience, she has been a strong voice for linguistically appropriate healthcare at the national, state, and local levels, participating in efforts led by the Joint Commission, the American Medical Association, and the HHS Office of Minority Health. Prior to becoming an independent consultant, she and SUNY colleagues received a 2009 National Institutes of Health grant supporting the Center for the Elimination of Minority Health Disparities at the University at Albany, SUNY, where she served as PI and Director of Community Engagement and Outreach.",
    photo: "/speakers/wilma-alvarado-little.webp",
  },
];
