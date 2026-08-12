// The people currently enrolled in AALB training, as supplied by the training
// team on August 11, 2026.
//
// Kept apart from student-roster.ts on purpose. That file is a large historical
// export, reconciled once, where "student" meant current at the time it was
// built and has since gone stale. This one is small, current, and easy to
// replace: paste a new list, redeploy, done.
//
// Anyone here counts as a current student for the conference scholarship,
// whatever the historical roster says about them. Columns:
//
//   studentId,firstName,lastName,email,cohort
//
// The `##` markers around some addresses in the source sheet are stripped. If
// they mean something (a hold, an unpaid balance, a withdrawal) these people
// should come out of this list, because as it stands they are eligible.

export const CURRENT_STUDENTS_UPDATED = "August 11, 2026";

export const CURRENT_STUDENTS_CSV = `studentId,firstName,lastName,email,cohort
13027,Joseph,Esparza,esparza.pep@gmail.com,130
13901,Maria,Lujan,mariablujan@gmail.com,139
13902,conslene,fontilus,fontilusconslene5@gmail.com,139
13801,Veronica,Balladares,vballadares675@gmail.com,138
13903,Jagruti,Mehta,dave.jagruti11@gmail.com,139
13904,Jacob,Binfet,jake@binfet.com,139
C13905,Megha,Bhakta,meghabhakta84@gmail.com,139
13906,Dulce,Perez,dcperez@yahoo.com,139
13907,Wendell,Alcenat,abnyawe2@gmail.com,139
13908,Morgan,Handy,morganehandy@gmail.com,139
13909,Mary,Rojas,mareshdra@gmail.com,139
C13910,Thuy Nhien,Huynh,emi.nhien@gmail.com,139
13911,Sephora,Tabet,tabetsephora5@gmail.com,139
13912,FATIMATA,NANA,FATIMATANANA3@GMAIL.COM,139
13913,Bi Bi Gulsom,Ghaleb,gulsomghalib@gmail.com,139
13914,King Madoche,Charles,charleskingmadoche@gmail.com,139
13915,Kadiatou,Kallo,kallokadiatou24@gmail.com,139
13916,Adriana,Navarro,adriananavarrobr@gmail.com,139
13917,Gabriel,Martinez,gabharm@yahoo.com,139
13918,julyssa,montiel flore,july_floresm@yahoo.com,139
13919,Bryan E,Soto Santos,estuardosantos10@icloud.com,139
PD13920,Sonika,Gupta,gsonika@hotmail.com,139
13921,Hanna,Hlukhova,hhlukhova6979@mysvc.skagit.edu,139
13922,Lucy,De Lefevre,LKJoulfayan@gmail.com,139
13923,Naheel,Rahmeh,naheelr2018@gmail.com,139
13924,Sordemary,Matos,sordemarymatos@icloud.com,139
13925,Tanehy,Alvarez,alvareztbh@gmail.com,139
13926,Youngjun,Chang,youngjun0611ca@gmail.com,139
C14001,Ainslie,Romero,aromero@sll.org,140
14002,Karina,Feria,kariivette.21@gmail.com,140
D14003,Nathalie,Jones,Natha.995@hotmail.com,140
14004,Ken,Cramer,ken7lee7c@gmail.com,140
C14005,Lal,Lian,mrram07@gmail.com,140
C14006,Derek,Talbott Peralta,derektalbott7.06@gmail.com,140
14008,Ximena,Valdes,vtximena1@gmail.com,140
14009,Alma,Diaz,almayela@gmail.com,140
14010,Harnarender,Kaur,kaurhoney222@gmail.com,140
14011,TRI,LUONG,triluong.272@gmail.com,140
14012,Kenya,Ruiz,ruizkenyasky@gmail.com,140
14013,Ossila,Morinvil Francois,ossilam@yahoo.com,140
14014,Gabriel,Candido,gwangacandido@gmail.com,140
14015,Andrea,Salas Moreno,andyypaco08@gmail.com,140
14016,Ghulam,Azizi,ghulamazizi38@gmail.com,140
14017,Daniel,Arias,123darias@gmail.com,140
14018,Anderson,Blalock,anderson.blalock@gmail.com,140
C14019,Deesa,Patel,deesa0987@gmail.com,140
14020,Cheryl,West,bcltwins@gmail.com,140
14021,Kwassi,Adela,medicalinterpretation515@gmail.com,140
14022,Abeda,Ahmady,abedaahmady123@gmail.com,140
14023,Natasha,Roche,roche.natasha@gmail.com,140`;

export const CURRENT_STUDENT_COUNT = 50;
