// Confirmed speakers shown in the landing "Featured Speakers" section.
// Curated by hand (not pulled from the presenter database) so the public
// lineup only ever shows people who have truly confirmed. Add a new entry as
// each speaker confirms; drop their headshot in /public/speakers/.

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
    title: "Attending Physician, Hospital-Based Medicine",
    org: "Ann & Robert H. Lurie Children’s Hospital of Chicago",
    bio: "A language-equity researcher and advocate, Dr. Takabatake has published on interpreter partnership during family-centered rounds. She co-founded and co-directs Lurie Children’s Language Access and Care Committee.",
    photo: "/speakers/yuri-takabatake.webp",
  },
  {
    slug: "yuliya-speroff",
    name: "Yuliya Speroff",
    credentials: "CoreCHI-P™",
    title: "Medical Interpreter Supervisor",
    org: "Harborview Medical Center, Seattle",
    bio: "A Russian–English certified medical interpreter, trainer, and vice president of the National Council on Interpreting in Healthcare. Author of medicalinterpreterblog.com, she was named CHIA’s Interpreter of the Year (2021) and AALB’s Trainer of the Year (2024).",
    photo: "/speakers/yuliya-speroff.webp",
  },
  {
    slug: "wilma-alvarado-little",
    name: "Wilma Alvarado-Little",
    title: "Associate Commissioner, Office of Minority Health",
    org: "New York State Department of Health",
    bio: "A language-access advocate with more than 40 years in healthcare, Wilma directs New York State’s Office of Minority Health and Health Disparities Prevention. As former co-chair of the NCIHC board, she helped deliver the field’s first national certification, standards of practice, and code of ethics for healthcare interpreters.",
    photo: "/speakers/wilma-alvarado-little.webp",
  },
];
