// Baked-in AALB student roster for the one-click "Load AALB students" button on
// the Attendees > Invite tab. Reconciled from the AALB registration sheets and
// the Accredible certificate export, deduped by email, and classified:
//
//   * alumni          1792  certificate holders (gold "alumni" letter)
//   * student            87  currently training or finished within 4 weeks
//   * former-student   1061  trained with us, no certificate on file
//                     ------
//                      2940  people total
//
// Every row carries its OWN template (column 6) so a single load applies the
// right framing per person; cohort / cohortOrder (columns 7-8) tag the training
// session number so the dashboard can sort newest-first and filter by session.
// Same comma-CSV shape parseAttendeeCsv() already understands:
//   firstName,lastName,email,affiliation,notes,template,cohort,cohortOrder
//
// The button POSTs this to /api/attendees with draftOnly:true, which bulk-loads
// everyone as "queued" (on the list, NOT emailed) with the 25% discount. Nothing
// sends until you send it. Rows already on the list are skipped, so re-clicking
// is safe. Sorted newest cohort first (session 141 -> 22) so if you send in
// order, the most recent students hear from us first.
//
// Generated file — regenerate rather than hand-editing individual rows.

export const STUDENT_ROSTER_COUNT = 2940;
export const STUDENT_ROSTER_ALUMNI = 1792;
export const STUDENT_ROSTER_STUDENT = 87;
export const STUDENT_ROSTER_FORMER = 1061;

export const STUDENT_ROSTER_CSV = `firstName,lastName,email,affiliation,notes,template,cohort,cohortOrder
Milagrito,Cora,aryanna092013@gmail.com,,Languages: Spanish,student,141,141
Rita,Kobeissi,ritakobeissi@gmail.com,,"Languages: Arabic, French, Russian",student,141,141
Ken,Cramer,ken7lee7c@gmail.com,,Languages: Spanish,student,140,140
Karina,Feria,kariivette.21@gmail.com,,Languages: Spanish,student,140,140
Nathalie,Jones,natha.995@hotmail.com,,Languages: Spanish,student,140,140
Ainslie,Romero,aromero@sll.org,,Languages: Spanish,student,140,140
Wendell,Alcenat,abnyawe2@gmail.com,,Languages: Haitian Creole,student,139,139
Veronica,Balladares,vballadares675@gmail.com,,Languages: Spanish,student,139,139
Megha,Bhakta,meghabhakta84@gmail.com,,Languages: Gujarati and Spanish,student,139,139
Jacob,Binfet,jake@binfet.com,,Languages: Spanish,student,139,139
Joseph,Esparza,esparza.pep@gmail.com,,Languages: Spanish,student,139,139
conslene,fontilus,fontilusconslene5@gmail.com,,Languages: Haitian Creole and French,student,139,139
Gulsom,Ghaleb,gulsomghalib@gmail.com,,"Languages: Pashto, Dari",student,139,139
Morgan,Handy,morganehandy@gmail.com,,Languages: Spanish,student,139,139
Thuy Nhien,Huynh,emi.nhien@gmail.com,,Languages: Vietnamese,student,139,139
Maria,Lujan,mariablujan@gmail.com,,Languages: Spanish,student,139,139
Jagruti,Mehta,dave.jagruti11@gmail.com,,Languages: Gujarati and Hindi,student,139,139
FATIMATA,NANA,fatimatanana3@gmail.com,,Languages: French and Moore,student,139,139
Dulce,Perez,dcperez@yahoo.com,,Languages: Spanish,student,139,139
Mary,Rojas,mareshdra@gmail.com,,Languages: Spanish,student,139,139
Sephora,Tabet,tabetsephora5@gmail.com,,Languages: Haitian creole,student,139,139
Yesenia,Delgado,yeseniadelgado0716@gmail.com,,Languages: Spanish,student,137,137
Lyn,Dorange,lyndorange733@gmail.com,,"Languages: Haitian Creole, French",student,137,137
Elius,Elusme,elusmeelius@gmail.com,,Languages: French and Spanish,student,137,137
Arlet,Eskandari,arlet.alex14@gmail.com,,Languages: Farsi,student,137,137
Vanessa,Eugene Severe,vanessa.eugene@icloud.com,,"Languages: Creole ,French",student,137,137
Angel,Gutierrez,gutierre320@gmail.com,,Languages: Spanish,student,137,137
Beatriz,Hernandez,bhernandez031415@gmail.com,,Languages: Spanish,student,137,137
Katherine,Kim,nayounida7@gmail.com,,Languages: Korena,student,137,137
Nageda,Laurent,nadgielaureen@yahoo.fr,,Languages: Creole and French,student,137,137
Vanesa,Nunez,vanesanunez882@yahoo.com,,Languages: Spanish,student,137,137
Kimberly,O'Campo,diaryofthisvegan@gmail.com,,Languages: Spanish,student,137,137
Luciene,Paes Caldeira,lucycaldeira@hotmail.com,,Languages: Portuguese,student,137,137
Mendel,Roseme,rosememendel22@gmail.com,,Languages: Haitian Creole and French,student,137,137
Jessica,Sanchez Hernandez,jsanchezhernandez815@gmail.com,,Languages: Spanish,student,137,137
Patricia,Smeltz,patriciasmeltz7@gmail.com,,Languages: Spanish,student,137,137
Rosa,Solis-Sandoval,rs8292435@gmail.com,,Languages: Spanish,student,137,137
Valeria,Sotelo,vale433476@outlook.com,,Languages: Spanish,student,137,137
Gabriela,Suquilanda,gabrielasuquilanda@gmail.com,,Languages: Spanish,student,137,137
Angelica,Valadez,xvoang23@gmail.com,,"Languages: Haitian Creole, French",student,137,137
Vaniola,Valliere,vallierevaniola@gmail.com,,"Languages: Creole ,French",student,137,137
Kasandra,Vega,kasandrav_96@hotmail.com,,Languages: Spanish,student,137,137
Milady,Velazquez,drmvelazquezdn@gmail.com,,Languages: Spanish,student,137,137
Ana,Ward,aeward1328@gmail.com,,Languages: Spanish,student,137,137
Dahlia,Alkazraji,dahlia.jassim@gmail.com,,Languages: Arabic,student,136,136
Cassandra,Cruztitla,cass.cruztitla@gmail.com,,Languages: Spanish,student,136,136
jalymuso,diebate,jdiebatd@gmail.com,,Languages: Wolof,student,136,136
Marielys,Gabino,gabinomarielys@gmail.com,,Languages: Spanish,student,136,136
Nemat,Ihmud,nematihmud97@gmail.com,,Languages: Arabic,student,136,136
Vieux,Kande,vkande21@gmail.com,,Languages: French,student,136,136
William,Lee,welern@yahoo.com,,Languages: Spanish,student,136,136
mohamed,mohamed,mohmoh0499@gmail.com,,Languages: somali,student,136,136
Alexia,Montoya,al3xia98@gmail.com,,Languages: Spanish,student,136,136
Dawn,Rathbuin,smileyfingers@gmail.com,,Languages: ASL,student,136,136
Bernice,Rios,berenice09rios09@gmail.com,,Languages: Spanish,student,136,136
Victoria,Robinson,vrobinson4799@gmail.com,,Languages: Spanish,student,136,136
Elena,Settle,chupik257@gmail.com,,Languages: Russian,student,136,136
TeAiris,Simmons,teairissimmons@yahoo.com,,Languages: Spanish,student,136,136
Melina,Sosa,melinasosapig@gmail.com,,Languages: Spanish,student,136,136
Begum,Sultana,bgsultana63@gmail.com,,,student,136,136
Isaac,Thang Hoe,kafka.smiled.photography@gmail.com,,"Languages: Burmese, Falam",student,136,136
Minh,Tran,baominh.tranthi@gmail.com,,Languages: Vietnamese,student,136,136
Stephani,Tris-Andayani,stephanishally123@gmail.com,,Languages: Indonesian,student,136,136
Daniela,Vazquez,danielavazquez146@yahoo.com,,Languages: Spanish,student,136,136
Zamanta,Walters,zamanta1302@gmail.com,,Languages: Spanish,student,136,136
Wei,Zhou,zhouwei70jp@gmail.com,,Languages: Chinese,student,136,136
Kevin,Baez,baezkj11@gmail.com,,Languages: Spanish,student,134,134
Luis,Conde,lconde2010@gmail.com,,Languages: Spanish,student,134,134
Ekaterina,Deldina,deldina.er@gmail.com,,Languages: Russian,student,134,134
Helia,Evora,heliaandrade16@gmail.com,,Languages: Portuguese,student,134,134
Diego,Forte,forte.diego14@gmail.com,,Languages: Spanish,student,134,134
Karla,Garcia,gkarla.0724@gmail.com,,Languages: Spanish,student,134,134
Evelyn,Garibaldo Hernandez,garibaldoevelyn@gmail.com,,Languages: Spanish,student,134,134
Neisy,Hernandez,hernandezneisy0@gmail.com,,Languages: Spanish,former-student,134,134
Genesis,Herrera,herreragenesis451@gmail.com,,Languages: Spanish,student,134,134
Wafa,Humaida,wafa.humaida1@gmail.com,,Languages: Arabic,student,134,134
ALAN,JERONIMO,alanjerov@gmail.com,,Languages: Spanish,student,134,134
Josiah Zathanga,Khiangte,josiahzk@gmail.com,,Languages: Burmese and Mizo (Chin),student,134,134
Iris,Lama,irislama1414@gmail.com,,Languages: Spanish,student,134,134
QUY,LE,lelizzing@gmail.com,,Languages: Vietnamese,student,134,134
Samuel,Leal,lealvillasam@outlook.com,,Languages: Spanish,student,134,134
Bradley,Loasi Madombe,gbraad.123@gmail.com,,Languages: Haitian Creole,student,134,134
Joanna,Rodriguez,joarodriguez224@gmail.com,,Languages: Spanish,student,134,134
Sintia,Rodriguez,rodriguez82612@gmail.com,,Languages: Spanish,student,134,134
Yi-Shiuan,Shih,joyce07128989@gmail.com,,Languages: Mandarin,student,134,134
Vilfort,Toussaint,toussaintvilfort20@gmail.com,,Languages: Haitian Creole,student,134,134
Reema,Williams,reemawilliams28@gmail.com,,Languages: Urdu,student,134,134
yiting,zheng,yitingzheng.usa@gmail.com,,Languages: Mandarin and Cantonese,student,134,134
Tebbie,Afshar,tebbie.afshar@gmail.com,,Languages: Farsi,former-student,133,133
Ibrahim,Ahmed,ibrahim@aalb.org,,"Languages: Arabic, Kurdish",former-student,133,133
NACERA,Boutekrabet,nacera.btkrt@gmail.com,,"Languages: Arabic, French",former-student,133,133
Akarrius,Boyd,kaniboyd@gmail.com,,Languages: Spanish,former-student,133,133
Daria,Bui,dana_kot@yahoo.com,,Languages: Russian,former-student,133,133
Karen,Contreras,elisacontreras7464@gmail.com,,Languages: Spanish,former-student,133,133
Dulce,Garcia,dulcegarcia.k@gmail.com,,Languages: Spanish,alumni,133,133
Sofia,Gonzales,sofia@aalb.org,,Languages: Spanish,alumni,133,133
Mariana,Johnson,mary.goldd02@gmail.com,,Languages: Portuguese,alumni,133,133
Nilufar,Mamatvalieva,nilufarkhonm@gmail.com,,,former-student,133,133
Macarena,martinez rey,macareigna@gmail.com,,Languages: Spanish,alumni,133,133
Denise,Melo,melodm1705@gmail.com,,Languages: Spanish,former-student,133,133
Luana,Moura Pinto,luanarayssam@gmail.com,,Languages: Portuguese,former-student,133,133
Guadalupe,Rivas,grv1128@yahoo.com,,Languages: Spanish,former-student,133,133
Test,Student,kevin@aalb.org,,,alumni,133,133
ZULMA,ALAYON,zalayon29@gmail.com,,Languages: Spanish,former-student,132,132
Nonna,Alchanyan,n.alchanyan@gmail.com,,Languages: Armenian and Russian,former-student,132,132
Isabella,Andonie,isabellaandoniebono3@gmail.com,,Languages: Spanish,former-student,132,132
Khadija,Bashiri,khadija.bashiri123@gmail.com,,"Languages: Dari, Pashto, and Persian",former-student,132,132
Didy Beckmance Pierre,Behi,beckmance@hotmail.com,,Languages: French,former-student,132,132
Anna Alice,Carbonaro,annacarbonaro12@gmail.com,,Languages: Portuguese,former-student,132,132
Natalia,Dymkowski,ntlm92@gmail.com,,Languages: Polish,former-student,132,132
Musarrat,Faisal,musarrat.faisal@hotmail.com,,Languages: Urdu,former-student,132,132
Syuzan,Harutyunyan,suzanharutunyan@gmail.com,,Languages: Russian,alumni,132,132
Diana,Hidalgo,dbhidalgo9@gmail.com,,,former-student,132,132
Jamshid,Khostai,jamshidkhostai010@gmail.com,,"Languages: Pashto, Dari, and Urdu.",former-student,132,132
Lisseth,Lalangui,dralissethlalang@gmail.com,,Languages: Spanish,former-student,132,132
YISSEL,MARTE,yisselmarte1219@gmail.com,,Languages: Spanish,former-student,132,132
daniela,mejia,danielamejia29@yahoo.com,,Languages: Spanish,former-student,132,132
Raquel Loza,Moraga,raquel.loza.moraga@gmail.com,,Languages: Spanish,former-student,132,132
Tahamina,Morshed,ameymorshed@gmail.com,,Languages: Bengali,former-student,132,132
Rocio Magaly,Perez Paredes,rmparedes12@gmail.com,,Languages: Spanish,former-student,132,132
Kenya,Rosado,kenyarosado14@icloud.com,,Languages: Spanish,former-student,132,132
Abdul Sabir,Shirzad,shirzadaf@gmail.com,,"Languages: Dari, Pashto, Urdu, and Russian.",former-student,132,132
Nancy,Solano,nsolano07@gmail.com,,Languages: Spanish,former-student,132,132
Olivia,Wong,viawong02@gmail.com,,Languages: Spanish,former-student,132,132
Elias,Alvarez,ealvarezz0707@gmail.com,,Languages: Spanish,former-student,131,131
Jessica,Angulo,jessicaangulo@att.net,,Languages: Spanish,former-student,131,131
Elder,Castaneda,eldarcastaneda81@gmail.com,,Languages: Spanish,former-student,131,131
Andrea,Cortez Tornero,andreacorteztornero@gmail.com,,Languages: Spanish,former-student,131,131
Odanette,Dupre,dodanette@yahoo.com,,Languages: Haitian Creole,former-student,131,131
Tabinda,Fatima,tabinda.shujah@gmail.com,,"Languages: Urdu, Hindi",former-student,131,131
grace,franco,gfranco4199@gmail.com,,Languages: Spanish,former-student,131,131
Leaneldy,Gil,leaneldy@gmail.com,,Languages: Spanish,former-student,131,131
Juanita,Grenot,grenotj@gmail.com,,Languages: Spanish,former-student,131,131
KAPI,HANSA,juristetraductriceagreee@gmail.com,,Languages: French,former-student,131,131
chong,kim,fitesaa@gmail.com,,Languages: korean,alumni,131,131
Elizabeth,Lakoma,elizabeth.lakoma@gmail.com,,Languages: Polish,former-student,131,131
GRACIELA,MARTINEZ,gracielamartinez868@yahoo.com,,Languages: Spanish,former-student,131,131
Karen,Montiel,kamontiel@hotmail.com,,Languages: Spanish,former-student,131,131
Mujibullah,Motawakil,mujibullahmutawakil@gmail.com,,"Languages: Pashto, Dari , pashaie",former-student,131,131
Kathy,Navarro,kathyjeanette32@gmail.com,,Languages: Spanish,former-student,131,131
Aurelie Daisy,Nouve,aurelienouve@gmail.com,,Languages: French,former-student,131,131
Anyi,Rodriguez,anyirodriguez2905@gmail.com,,Languages: Spanish,former-student,131,131
Ngan,To,s2timtims2@yahoo.com,,Languages: Vietnamese,former-student,131,131
Amadou,Toure,atoure07@gmail.com,,Languages: French,former-student,131,131
JORGE ENRIQUE,URIBE LARREA,1976euribe@gmail.com,,Languages: Spanish,alumni,131,131
Fritzi,Velazquez,fritzzv@gmail.com,,Languages: Spanish,former-student,131,131
Rosee,Voigtlander,rosee_bv@hotmail.com,,Languages: Spanish and Catalan,former-student,131,131
Mario Jose,Amador Gaitan,mjag1980@gmail.com,,Languages: Spanish,alumni,130,130
Abigail,Bolen,abigailbolen@gmail.com,,Languages: Spanish,former-student,130,130
Maria Paz,Campos,mpazcampos15@outlook.es,,Languages: Spanish,former-student,130,130
Leslie,Castaneda,lachi897@yahoo.com,,Languages: Spanish,former-student,130,130
Noni,Cullinan,nonicullinan@gmail.com,,Languages: Spanish,former-student,130,130
Nuve,Cungachi,elicungachi@gmail.com,,Languages: Spanish,former-student,130,130
Lorena,Ferreira,lorenamoniseferr@gmail.com,,Languages: Portuguese,former-student,130,130
Abby,Giambattista,abby@g-eleven.com,,Languages: ASL,former-student,130,130
Rebeckah,Gonzalez,gonzalezrs9308@gmail.com,,Languages: Spanish,former-student,130,130
Aimee,Hernandez,cattyaimee@gmail.com,,Languages: Spanish,former-student,130,130
Emilee,Hester,emileehester1@gmail.com,,Languages: Spanish,former-student,130,130
Catherine,Lopez Barajas,catherine@aalb.org,,Languages: Spanish,former-student,130,130
Brayan,Marinez,martinezbrayan221@gmail.com,,Languages: Spanish,former-student,130,130
Christian,Martinez,cmart0704@gmail.com,,Languages: Spanish,former-student,130,130
Yajaira,Michel,yvalencia2018@gmail.com,,Languages: Spanish,former-student,130,130
Gabriel,Odreman-Medina,thegman10288@gmail.com,,Languages: Spanish,former-student,130,130
Elizabeth,Oleta Lopez,elizabetholeta27@gmail.com,,Languages: Spanish,former-student,130,130
Sauda,Omari,cyizanye15@gmail.com,,"Languages: Swahili, kinyarwanda, kirundi, kiganda",former-student,130,130
Valeria,Ortiz,moa.ortiz@icloud.com,,Languages: Spanish,former-student,130,130
Paola Alejandra,Ramos De Escobar,paoshoder27@gmail.com,,Languages: Spanish,alumni,130,130
Emily,Rodriguez,e.rodri73@gmail.com,,Languages: Spanish,former-student,130,130
Lesly Eunice,Ruiz de Ely,lesly@puravida.org,,Languages: Spanish,former-student,130,130
Marjorie,Sanchez,marjorie.isa.sanchez@gmail.com,,Languages: Spanish,former-student,130,130
Yukeimy,Sanchez,yukeimysanchez@gmail.com,,Languages: Spanish,former-student,130,130
Jose,Soto,alex.soto24816@gmail.com,,Languages: Spanish,former-student,130,130
Paula,Taborda,paulitaliona@gmail.com,,Languages: Spanish,alumni,130,130
Quynh,Trinh,myquynh1124@gmail.com,,Languages: Viernamese,alumni,130,130
Julieth Andrea,Velasco Yanez,juliethvelascoy@gmail.com,,Languages: Spanish,former-student,130,130
Karen,Arboleda Vargas,karena.02@hotmail.com,,Languages: Spanish,former-student,129,129
Bianca,Bercê Macedo,biabercemacedo@gmail.com,,Languages: Portuguese,former-student,129,129
Francky,Chérubin,franckycherubin92@gmail.com,,Languages: Haitian Creole,former-student,129,129
Jefferson,Cordero,thejuarez1010@gmail.com,,Languages: Spanish,former-student,129,129
Daribel,Custodio de Souza,ladarycustodio@gmail.com,,Languages: Spanish,former-student,129,129
Lynn,Daguerre,ldaguerre44@hotmail.com,,Languages: Haitian Creole,former-student,129,129
Jean,Dor,mullerdor4@gmail.com,,Languages: Haitian Creole,former-student,129,129
Guadalupe,Figueroa,guadamena4853@gmail.com,,Languages: Spanish,former-student,129,129
Rachel,Flores,rachelf3601@gmail.com,,Languages: Spanish,alumni,129,129
Isabella,Hernandez Reyes Mordaunt,bell.hernandez1315@gmail.com,,Languages: Spanish,former-student,129,129
Cristina,Iordan,mciordan@yahoo.com,,Languages: Romanian,former-student,129,129
Leo,Liu,zliu0108@gmail.com,,Languages: Mandarin,former-student,129,129
Kris,Low,klow@san.rr.com,,Languages: Spanish,former-student,129,129
Charles,Maa,chuckmaa@gmail.com,,Languages: Chinese,former-student,129,129
Jaqueline,Marques ocampo,jaquelinemarquesocampo@gmail.com,,Languages: Portuguese,former-student,129,129
Yoskama,Moussignac,moussignacyoskama62@gmail.com,,Languages: Haitian Creole,former-student,129,129
Amilcar,Navarro,navarro.amilcar94@gmail.com,,Languages: Spanish,former-student,129,129
Luz,Nova,luzjanethnova@gmail.com,,Languages: Spanish,former-student,129,129
Sandra,Peraza,perazasnd89@gmail.com,,Languages: Spanish,former-student,129,129
Valentyna,Ruzhytska,valruzhytska@gmail.com,,"Languages: Ukranian, Russian",former-student,129,129
ruth,sanchez,sanchez.ruth6@icloud.com,,Languages: Spanish,former-student,129,129
Jair,Tejada,jairtejada1411@gmail.com,,Languages: Spanish,former-student,129,129
Sorly,Yang,sorlyyangja23@gmail.com,,"Languages: Hmong,Lao, Thai",former-student,129,129
Fitya,Abasha,fityaabasha@gmail.com,,Languages: Amharic,former-student,128,128
Korina,Aguirre,korina.aguirre@icloud.com,,Languages: Spanish,former-student,128,128
vanessa,arias,vanessa.arias86@gmail.com,,Languages: Spanish,former-student,128,128
Samuel Bobbio,Bagyo Jr,tesorojr2001@gmail.com,,Languages: French,former-student,128,128
Eduvelys Raquel,Barrios,eduvelysbarrios@gmail.com,,Languages: Spanish,former-student,128,128
Katelyn,Bennett,katedb736@gmail.com,,Languages: Spanish,alumni,128,128
Carlos,Blanco,carlosbln@outlook.com,,Languages: Spanish,former-student,128,128
Andrea,Campos,andreac2988568@outlook.com,,Languages: Spanish,former-student,128,128
Jairo,Delgado,jamadelgado@gmail.com,,Languages: Spanish,former-student,128,128
Labissi,Dinan,dinlmas2010@yahoo.com,,Languages: French,former-student,128,128
Joseph,Hernandez,jjhernandezn02@gmail.com,,Languages: Spanish,former-student,128,128
Mohammad Mahdi,Hussaini,mahdijan.8602@gmail.com,,Languages: Dari and pashtu,former-student,128,128
Hussein,Kareem,hussein.vdwl@gmail.com,,Languages: Arabic,former-student,128,128
Clara Ines,Magallanes Robles,claramaga1218@gmail.com,,Languages: Spanish,former-student,128,128
Pierre,Marc,marcpierre898@gmail.com,,Languages: Haitian Creole,former-student,128,128
BEATRICE,MATSEUDJOU EPSE KAMADJEU,beakamadjeu@yahoo.fr,,Languages: French,former-student,128,128
Jessica,Paredes,jesspha2@gmail.com,,Languages: Spanish,former-student,128,128
Tawany,Perez,tawanyperez@gmail.com,,Languages: Spanish,former-student,128,128
Alexandra,Restrepo,alerestrepo88@gmail.com,,Languages: Spanish,former-student,128,128
Rosa,Rico,elenarazo2413@gmail.com,,Languages: Spanish,former-student,128,128
Lindsey,Sanchez,lindseymonse@gmail.com,,Languages: Spanish,former-student,128,128
Tsigab,Tadesse,tsi2050@gmail.com,,Languages: Tigrinya,former-student,128,128
Doralis,Vargas García,docastle13@gmail.com,,Languages: Spanish,former-student,128,128
Hellen,Aparecida,hellen.cristinna95@gmail.com,,Languages: Portuguese,former-student,127,127
Valentina,Arce,arcevalentina@gmail.com,,Languages: Spanish,alumni,127,127
Lisbet,Barbosa,lizbarbosaaa03@gmail.com,,Languages: Spanish,former-student,127,127
Pedro,Barbosa,pedrolcsas@gmail.com,,Languages: Brazilian Portuguese,alumni,127,127
Julia,Castaneda,jmrojas924@yahoo.com,,Languages: Spanish,former-student,127,127
Rachel,Cruz,rachelpoliani@gmail.com,,Languages: Portuguese,alumni,127,127
Isabella,Gonzalez,isa.t.g0924@gmail.com,,Languages: Spanish,former-student,127,127
Mai,Her,maiyiaher103@gmail.com,,Languages: Hmong,alumni,127,127
Mariana,Hernandez,marianah13@yahoo.com,,Languages: Spanish,former-student,127,127
Doussou,Kaba,dskaba79@gmail.com,,Languages: French,former-student,127,127
Aminata,Kante,aminatanour2025@gmail.com,,Languages: French,former-student,127,127
Paris,Karniadakis,pkarni13@gmail.com,,Languages: Spanish,former-student,127,127
Christine,Lee,christine_lee01@hotmail.com,,Languages: Cantonese,former-student,127,127
Van Daisy,Lian,vandaisylian13@gmail.com,,"Languages: Burmese, Hakha Chin and Falam Chin",former-student,127,127
Naidelin,Lorenzo Cervantes,lorenzocervantesnaidelin@gmail.com,,Languages: Spanish,former-student,127,127
Bryan,Maldonado,bryan.maldonadok1234@gmail.com,,Languages: Spanish,former-student,127,127
Gabriela,Moreno,gmoreno321321@gmail.com,,Languages: Spanish,alumni,127,127
Alex,Pierres,alexpierres1978@gmail.com,,Languages: Spanish,former-student,127,127
Jose,Ramirez,rafaramirez10241024@gmail.com,,Languages: Spanish,former-student,127,127
Susana,Rico,sricordh@gmail.com,,Languages: Spanish,former-student,127,127
Daniela,Robledo,robledo881@gmail.com,,Languages: Spanish,former-student,127,127
Anne,Sullivan,anne1sport@gmail.com,,Languages: Spanish,alumni,127,127
Karla,Sánchez,ccedenok.89@gmail.com,,Languages: Spanish,alumni,127,127
Genesys,Trujillo,genesysbtrujillo@icloud.com,,Languages: Spanish,former-student,127,127
Tania,Varela Acosta,tania.varela301@gmail.com,,Languages: Spanish,former-student,127,127
Vixeleau,Vvincent,vixeleau90@gmail.com,,Languages: Haitian Creole,former-student,127,127
Lizbeth,Aguilar,zapataliz05@gmail.com,,Languages: Spanish,former-student,126,126
Ibrahim,Ahmed,greatv2021@gmail.com,,Languages: Arabic,former-student,126,126
Selene Lizeth,Alvarez Siqueiros,selenealvarez0821@gmail.com,,Languages: Spanish,former-student,126,126
Rania,Arif,rania.arif18@gmail.com,,"Languages: French, Arabic",former-student,126,126
Luisa,Barajas-Sanchez,luisabarajas.25@gmail.com,,Languages: Spanish,former-student,126,126
Emily,Bruns,edde3dd3@gmail.com,,Languages: ASL,former-student,126,126
Aide,Cadena,aide.osornio@gmail.com,,Languages: Spanish,former-student,126,126
Yuting,Chen,yutingchenc@gmail.com,,"Languages: Mandarin, Cantonese, Taishanese",alumni,126,126
Christopher,Gertsch,chrissgertsch@gmail.com,,Languages: Spanish,alumni,126,126
Rosa,Hernandez,rosacody6@yahoo.com,,Languages: Spanish,former-student,126,126
Andy,Herrera,andy21h13@gmail.com,,Languages: Spanish,former-student,126,126
Maru,Johnston,fairymaru@yahoo.com,,"Languages: Spanish, French, Italian",former-student,126,126
Ana,Lopez,ana_lopez_camacho@yahoo.com,,Languages: Spanish,former-student,126,126
Danna,Medvedeva,danna.sherimova@gmail.com,,Languages: Russian,former-student,126,126
Sala,Nahshal,salanahshal09@gmail.com,,Languages: Arabic,alumni,126,126
AN KHANH,NGUYEN,nguyenankhanh0404@gmail.com,,Languages: Vietnamese,alumni,126,126
Madeline,Otero,made_gisselle21@yahoo.com,,Languages: Spanish,former-student,126,126
Brenda,Pinon,brenda_9915@hotmail.com,,Languages: Spanish,former-student,126,126
EVA,QUINTANA,eva4j2006@aol.com,,Languages: Spanish,former-student,126,126
Jamie,Reisman,jeflather@gmail.com,,Languages: Spanish,alumni,126,126
Blanca,Rico,chapab00187@gmail.com,,Languages: Spanish,former-student,126,126
itzel,rodriguez,itzelr82@gmail.com,,Languages: Spanish,former-student,126,126
Yadira,Roman,yadiraroman109@gmail.com,,Languages: Spanish,former-student,126,126
Susan,Rosales,susanr2186@yahoo.com,,Languages: Spanish,former-student,126,126
Mabel,Santos,smabes1826@gmail.com,,Languages: Spanish,former-student,126,126
Chrisnove,Tica,chrisnovet@gmail.com,,"Languages: French, Haitian Creole, Spanish",former-student,126,126
Maria,Adams,mmadams.ma@gmail.com,,Languages: Spanish,former-student,125,125
Zaday,Alayo De La Fe,zaday.alayo@yahoo.com,,Languages: Spanish,former-student,125,125
Anabel,Amaya,aamaya101@gmail.com,,Languages: Spanish,former-student,125,125
Marco,Beltran,mbel33054@gmail.com,,Languages: Spanish,former-student,125,125
Lucia,Castaneda,lucy.05alv@gmail.com,,Languages: Spanish,former-student,125,125
Nubia,Daguiar,nubiadaguiar.job@gmail.com,,Languages: Spanish & Portuguese,former-student,125,125
Mackenzie,Fry,kenzie_nicole@live.com,,Languages: ASL,former-student,125,125
Lizbeth,Garcia,lizbeth2400@icloud.com,,Languages: Spanish,former-student,125,125
Naivy,Guanche,nguanche3110@gmail.com,,Languages: Spanish,former-student,125,125
Yasmine,Hamed,yasminehamed3031@gmail.com,,Languages: Arabic,former-student,125,125
Brooke,Heiser,brookeheiser529@gmail.com,,Languages: Chinese/Mandarin,former-student,125,125
Nikolai,Kovalenko,kolani46@gmail.com,,Languages: Russian,alumni,125,125
Nadiia,Kutsevol,nadiia@kutsevol.com,,Languages: Ukrainian and Russian,former-student,125,125
Jessica,Lopez Leyva,ljessie7592@gmail.com,,Languages: Spanish,former-student,125,125
Dalett,Luna,dalettlunac@gmail.com,,Languages: Spanish,alumni,125,125
Bryan,Padilla,padilla.bryan83@gmail.com,,Languages: Spanish,former-student,125,125
Karla,Paredes,kparedes80@gmail.com,,Languages: Spanish,former-student,125,125
Mariana,Rodriguez,purpura_@hotmail.com,,Languages: Spanish,former-student,125,125
Dilorom,Sangmamadova,s.dilorom2014@gmail.com,,Languages: Russian,alumni,125,125
Omar,Sediqe,omarsediqe93@gmail.com,,"Languages: Dari, Hindi, Urdu, Punjabi",former-student,125,125
Ben,Simpson,bendra95@gmail.com,,Languages: Spanish,alumni,125,125
Jean-Danielle,Thiombiano,carhelgrace955@hotmail.com,,Languages: French,former-student,125,125
Jin Young,You,irides93@gmail.com,,Languages: Korean,former-student,125,125
Breeze,Andrade,breeze.cota@gmail.com,,Languages: Spanish,former-student,124,124
GENIFA,ARZU,garzu21@yahoo.com,,Languages: Spanish,former-student,124,124
Mohibullah,Ayoubi,mohibayoubi16@gmail.com,,"Languages: Dari, Persian",former-student,124,124
Alison,Caballero,ali82003c@gmail.com,,Languages: Spanish,alumni,124,124
Hallmar,Calderon Herrera,hallmar71@hotmail.com,,Languages: Spanish,former-student,124,124
Rigoberto,Carreon Jr,rigocarreon06@gmail.com,,Languages: Spanish,former-student,124,124
Sandra,Crespo Caballero,sandra.crespo.smcc@gmail.com,,Languages: Spanish,former-student,124,124
Jonathan,Erickson,jerickson87@gmail.com,,Languages: Spanish,former-student,124,124
Karen,Garcia-Vasquez,jvasquez091976@gmail.com,,Languages: Spanish,former-student,124,124
Jn marc,Jean,manofgod180400@gmail.com,,"Languages: Haitian creole , Spanish , French",former-student,124,124
Roderick,Jones,rodcjones@comcast.net,,Languages: Spanish,alumni,124,124
Arseli,Koppas,rselikoppas.456@gmail.com,,Languages: Spanish,former-student,124,124
Ricardo,Martinez,riandreecdxx@live.com,,Languages: Spanish,former-student,124,124
Alyson,Martorana,ibelonginneverland@gmail.com,,Languages: American Sign Language,alumni,124,124
Joeli,Meyers,jmlld3@yahoo.com,,Languages: Spanish,former-student,124,124
Kobra,Mohammadi,kobramohammadi614@gmail.com,,"Languages: Dari, Farsi",former-student,124,124
Diane,Ngongo,grasara16@gmail.com,,Languages: Swahili and French,former-student,124,124
Sora,Park,sora.sky.park@gmail.com,,Languages: Korean,alumni,124,124
Silvia,Quizhpi Tomlinson,quizhpisilvia@gmail.com,,Languages: Spanish,former-student,124,124
Oreana,Rodas,oreo98rodas@gmail.com,,Languages: Spanish,alumni,124,124
Dora,Serna,dorita_serna@msn.com,,Languages: Spanish,former-student,124,124
Daniela,Ulloa,daniorellana1992@hotmail.com,,Languages: Spanish,former-student,124,124
Mya Hnin,Yee,myahninyee26@gmail.com,,Languages: Burmese,alumni,124,124
Fabiola,Anguiano,fanguiano0219@gmail.com,,Languages: Spanish,former-student,123,123
Manal,Elessawy,maya_9096@yahoo.com,,Languages: Arabic,former-student,123,123
Karla,Espinal,kespinal1999@gmail.com,,Languages: Spanish,former-student,123,123
Veronica,Espinoza,harm@scopehealthcouncil.com,,Languages: Spanish,former-student,123,123
Ayna,Gochyyeva,aynacal@gmail.com,,Languages: Russian,alumni,123,123
Marlyn,Gonzalez,marlyngonzalezz@gmail.com,,Languages: Spanish,former-student,123,123
Nereida,Hernandez Zavala,nereidaher22@gmail.com,,Languages: Spanish,former-student,123,123
Jean,Joseph,josephjeanbernard2022@gmail.com,,"Languages: Haitian Creole, French",alumni,123,123
Kossi,Logossou,kossilog88@gmail.com,,Languages: French,former-student,123,123
Elizabeth,Mejia,elopez0829@yahoo.com,,Languages: Spanish,former-student,123,123
Karen,Merino Hernandez,kmerino1202@gmail.com,,Languages: Spanish,former-student,123,123
Misael,Perez,rookiezero5@gmail.com,,Languages: Spanish,alumni,123,123
Mamadou,Sene,mamadousene649@gmail.com,,Languages: Wolof and French,alumni,123,123
Alina,Tuarsheva,alinatuarsheva@gmail.com,,Languages: Russian,alumni,123,123
Maria,Velloso,marialevelloso@gmail.com,,Languages: Portuguese,former-student,123,123
Paul,Buzimba,buzzyson1@gmail.com,,Languages: SWAHILI,former-student,122,122
Lucelia,Cabello,lucevane11@gmail.com,,Languages: Spanish,former-student,122,122
Nassima,Chougui,chouguinassima06@gmail.com,,Languages: French and arabic,former-student,122,122
Natalie,Cuevas,natalie.cuevas122005@gmail.com,,Languages: Spanish,alumni,122,122
Adam,Essa,adamessa111@gmail.com,,Languages: Arabic,former-student,122,122
Chin Ting,Fong,emilyfeng1996@gmail.com,,Languages: mandarin,alumni,122,122
Gabriela,Gilstrap,gabagaba3000@gmail.com,,Languages: Spanish,former-student,122,122
Zoila,Jimenez,zoilita1014@gmail.com,,Languages: Spanish,alumni,122,122
Daisy,Lopez-Bryant,lopez2819@yahoo.com,,Languages: Spanish,former-student,122,122
Crystal,Lowe,clowesigns@gmail.com,,Languages: ASL,alumni,122,122
Juliana,Meran Lee,mleejuliana1623@outlook.com,,Languages: Spanish,former-student,122,122
Loredana,Piepmeier,loredanap@yahoo.com,,Languages: Spanish,former-student,122,122
Khammone,Rosenbarker,rosenbarkerk@gmail.com,,Languages: Lao,alumni,122,122
Isaura,Soriano,janquelisaura@yahoo.com,,Languages: Spanish,former-student,122,122
Kimberly,Viera,vierakimberly97@gmail.com,,Languages: Spanish,alumni,122,122
JIAJIA,WEI,maggiejiajiawei@gmail.com,,Languages: Chinese Mardian,former-student,122,122
Wajidullah,Ahmadi,wajidahmadi555@gmail.com,,Languages: Pashto,former-student,121,121
Futoon,Alsurakhi,futoonalsurakhi@gmail.com,,Languages: Arabic,former-student,121,121
Nadege,Coissy Charles,ncoissy@yahoo.fr,,Languages: Haitian Creole,former-student,121,121
Ahmad Shoaib,Jalal,shoaibjalal125@gmail.com,,"Languages: Dari, Pashto, Farsi",alumni,121,121
Iris,Laffitte,iris@aalb.org,,"Languages: Haitian creole , Spanish , French",former-student,121,121
Elenor (Yi),Lin,eleanorlin2021@gmail.com,,Languages: Mandarin,alumni,121,121
Valeria,Lis,valerialism@gmail.com,,Languages: Spanish,former-student,121,121
Trini,Lopez Claros,lct.comser21@gmail.com,,Languages: Spanish,former-student,121,121
Daneiry,Melo,daneirymelo@outlook.com,,Languages: Spanish,former-student,121,121
Veronica,Pierce,vfperez8097@gmail.com,,Languages: Spanish,former-student,121,121
Mariana,Santiago,mariana.santiago1234@gmail.com,,Languages: Spanish,former-student,121,121
Abdul Latif,Satary,abdulsatary7@gmail.com,,Languages: Farsi/Dari,alumni,121,121
Imma,Vedrine,imma.v@aol.com,,,former-student,121,121
Kaisy,Wills,kaisylopez@hotmail.com,,Languages: Spanish,former-student,121,121
Nury,Cortez,nurycortez1970@gmail.com,,Languages: Spanish,former-student,120,120
Ana,Denis,caqd.1109@gmail.com,,Languages: Spanish,former-student,120,120
Valentina,Esmoriz,vf490927@gmail.com,,Languages: Spanish,former-student,120,120
Gadiel,Galvez,gadielgalvez0725@gmail.com,,Languages: Spanish,former-student,120,120
Madai,Galvez,madaiacosta05@gmail.com,,Languages: Spanish,alumni,120,120
Emy,Gilbert Avila,emygilbert@yahoo.com,,,former-student,120,120
Ariatna,Gomez,ariatnagomez@icloud.com,,Languages: Spanish,former-student,120,120
Beatrice,Jolie,beatricemjolie91@gmail.com,,Languages: Kinyarwanda and swahili,former-student,120,120
Miriam,Lizardi Lugo,lugolanguageservicesllc@yahoo.com,,,former-student,120,120
Yesenia,Mapes,jessiemapes@comcast.net,,Languages: Spanish,former-student,120,120
Eduardo,Neri,eduardoandres1118@gmail.com,,Languages: Spanish,former-student,120,120
Son,Nguyen,nguyenswanson@gmail.com,,Languages: Vietnamese,former-student,120,120
Ariana,Padilla,arianapadilla94@gmail.com,,Languages: Spanish,former-student,120,120
Yossimara,Ramirez,yossiramirez792@gmail.com,,Languages: Spanish,former-student,120,120
Shu Ju,Reed,juliareed2011@yahoo.com,,Languages: Mandarin,former-student,120,120
Jutsely,Rivera Valenzuela,jutsely.sammy@gmail.com,,Languages: Spanish,former-student,120,120
Orlando,Robles,sucasaorlando@gmail.com,,Languages: Spanish,former-student,120,120
Ngan,Than,tthnd62@gmail.com,,Languages: Vietnamese,alumni,120,120
Rogelio,Torres,rogelio.jose.torres@gmail.com,,Languages: Spanish,former-student,120,120
Jazmin,Vicente Garcia,flowerfrom2004@gmail.com,,Languages: Spanish,former-student,120,120
Nora,Aguilar,noraaguiriano@gmail.com,,Languages: Spanish,former-student,119,119
Rebecca,Arboite,rebeccaarboite00@gmail.com,,Languages: French And Haitian Creole,former-student,119,119
Citlali,Carrizales,ccarrizales020@gmail.com,,Languages: Spanish,former-student,119,119
Ying,Cheng,yc5354@gmail.com,,Languages: Mandarin,former-student,119,119
Yan Zhi,Ding,yan_zhi_ding@amda.edu,,Languages: Mandarin,former-student,119,119
Samari,Feria Rodriguez,samariferia@icloud.com,,Languages: Spanish,former-student,119,119
Maria Luiza,Goncalves,marialsantosg205@gmail.com,,Languages: Portuguese,alumni,119,119
Acayananda,Guzman,acayanandayg@gmail.com,,Languages: Spanish,former-student,119,119
Kayana,Mirzazada,kmirzazada2@gmail.com,,Languages: Dari,former-student,119,119
Rachel Sandrine,Ngouang,louangesmandeng@gmail.com,,Languages: French,alumni,119,119
Jazmine,Renteria Jimenez,jazminerenteria84@gmail.com,,Languages: Spanish,former-student,119,119
Samira,Sofizada,samsofizada1212@gmail.com,,Languages: Dari,former-student,119,119
Elaine,Torres-Grey,elainebio.torres@gmail.com,,Languages: Brazilian Portuguese,alumni,119,119
Linjing,Wu,linjingwu0414@gmail.com,,Languages: Mandarin,alumni,119,119
Christian,Antonio,antonio.christian97@gmail.com,,Languages: Spanish,alumni,118,118
Vianey,Caballero,vianeycaballero@gmail.com,,Languages: Spanish,former-student,118,118
Delia,De Gonzalez,deliago.mv@gmail.com,,Languages: Spanish,former-student,118,118
Abigail,Garcia Solis,med23solis@gmail.com,,Languages: Spanish,former-student,118,118
Carla,Garza,carlagarza27@gmail.com,,Languages: Spanish,alumni,118,118
Gisela Fernanda,Haro-Sierra,hs.fernanda90@gmail.com,,"Languages: American Sign Language, Spanish",former-student,118,118
Tinhinane,KEBBAB,tinatina2.kebbab@gmail.com,,Languages: Berber French and Arabic,alumni,118,118
Maroua,Louni,louni.maroua@icloud.com,,Languages: French and Arabic,former-student,118,118
Misael,Navarro,mjnc408@gmail.com,,Languages: Spanish,former-student,118,118
Jonathan,Nunez aguilar,jonysport795@gmail.com,,Languages: Spanish,former-student,118,118
Joshabet,Rosales,joshabetrosales@gmail.com,,Languages: Spanish,former-student,118,118
Sara,Santiago Alvarez,iamsarasantiago@gmail.com,,Languages: Spanish,alumni,118,118
Paulina,Trejo,trejo3382@gmail.com,,Languages: Spanish,alumni,118,118
Kizzy,Valencia,nidvalen@yahoo.com,,Languages: Spanish,former-student,118,118
Heba,Zahriyeh,hebaw4@yahoo.com,,Languages: Arabic,former-student,118,118
Jocelyn,Abines,jocelynabines143@gmail.com,,Languages: Filipino,former-student,117,117
Markeljada,Ahmetlli,markeljadaahmetlli@yahoo.com,,Languages: Albanian,former-student,117,117
Roro,Benjamin,rbenjamin1@mercy.com,,Languages: Haitian Creole,former-student,117,117
Esperandieu,Cenat,ecenat2011@yahoo.com,,"Languages: Haitian Creole , French, Spanish",former-student,117,117
Ana,Coello,annie15c@hotmail.com,,Languages: Spanish,former-student,117,117
Ana,Cortes,anajuliette64@gmail.com,,Languages: Spanish,alumni,117,117
Reginald,Durandisse,reginald_durandisse@yahoo.fr,,Languages: Creole,former-student,117,117
Kenia,Gonzalez,keniagonzalez0122@gmail.com,,Languages: Spanish,alumni,117,117
Yara,Juarez,yarajuarez.yj@gmail.com,,Languages: Spanish,alumni,117,117
Nereyda,Liceaga,nereyda.liceaga@yahoo.com,,Languages: Spanish,former-student,117,117
Lenilda,Lugon,lenilu-bra-usa@hotmail.com,,Languages: Spanish and Portuguese,alumni,117,117
Alicia,Martinez,licy672@gmail.com,,Languages: Spanish,alumni,117,117
Vinicius,Matias,vinmatias97@gmail.com,,Languages: Portuguese,alumni,117,117
Rosa,Mora,rosamora3741@icloud.com,,Languages: Spainsh,former-student,117,117
Leticia,Moreno,monkymony@sbcglobal.net,,Languages: Spanish,alumni,117,117
Arzoo,Nuristani,arzoodaycare@gmail.com,,,former-student,117,117
Mariela,Rodriguez,rodriguezmariela410@gmail.com,,Languages: Spanish,alumni,117,117
Yaismar,Rojas,yaismarrojas12@gmail.com,,Languages: Spanish,alumni,117,117
Hathar,Saleh,hatharsaleh@gmail.com,,Languages: Arabic,former-student,117,117
Diriye,Sheikh,dirie4579@gmail.com,,Languages: Somali,former-student,117,117
Emma,Tran,emmtranart@gmail.com,,Languages: Vietnamese,former-student,117,117
Lyudmila,Vasylevych,ludochka87@yahoo.com,,Languages: Ukrainian,former-student,117,117
Jazmine,Vivero,jazzbeats1920@gmail.com,,Languages: Spanish,alumni,117,117
Frankline,Wambua,wambuafrankie@gmail.com,,Languages: Swahili,alumni,117,117
Crystal,Carrillo,crystalcarrillo1616@gmail.com,,Languages: Spanish,former-student,116,116
Sebastian,Colmenares,sebas.andre1509@gmail.com,,Languages: Spanish,former-student,116,116
Loydie,Darcelin,loydiedarcelin@gmail.com,,Languages: Haitian Creole,former-student,116,116
Napatsorn,Diaz-Geronimo,bnapatsorn12@gmail.com,,Languages: Chinese,former-student,116,116
Maude,Durand,maude1love@icloud.com,,Languages: French,alumni,116,116
Rudy,Flugel,rudyflugel@gmail.com,,Languages: Spanish,former-student,116,116
Zulenny,Galvez,zulennyg@yahoo.com,,,former-student,116,116
Zainab,Haider,zainab0830@gmail.com,,Languages: Urdu,former-student,116,116
Teclehaimanot,Hiabu,teclemenghistu2017@gmail.com,,Languages: Tigrigna,alumni,116,116
Esmail,Khan,ekhan1603@gmail.com,,Languages: Bangla,former-student,116,116
Meire,M Harris,mharris126@gmail.com,,Languages: Portuguese,former-student,116,116
Cristian,Ossio,cristianossio@yahoo.ca,,Languages: Spanish,alumni,116,116
Tatiana,Reyes,reyestatiana25@gmail.com,,Languages: Spanish,former-student,116,116
Luciane,Rocha,babyveneno@hotmail.com,,Languages: Portuguese,alumni,116,116
Lucia,Siecola Gonzalez,luciasiecola26@gmail.com,,Languages: Spanish,former-student,116,116
Frank,Vega Velazquez,frankvega96@gmail.com,,Languages: Spanish,alumni,116,116
Mohammad Rasool,Zahiri,zahiri2002@yahoo.com,,Languages: Zahiri,former-student,116,116
Ibraham,Adam,wathiqmig@gmail.com,,,former-student,115,115
Alex,Allmon,alexallmon@mail.weber.edu,,Languages: Spanish,former-student,115,115
Ashley,Bid,ashleyabid01@gmail.com,,Languages: Spanish,former-student,115,115
Johanna,Bondar,johannabondar@gmail.com,,Languages: Russian,alumni,115,115
Dellys D,Coronado Gonzalez,daliacoronado62@gmail.com,,Languages: Spanish,alumni,115,115
Cesar,De Oliveira,cr-oliver@outlook.com,,Languages: Portuguese,former-student,115,115
Manal,Fathy,manalhome@yahoo.com,,Languages: Arabic,former-student,115,115
Devin,Gonzalez,devingonzalez246@gmail.com,,Languages: Spanish,alumni,115,115
Cynthia,Gudino,cynthiagudino@yahoo.com,,Languages: Spanish,former-student,115,115
Tural,Ibrahimov,tibrahimov@hotmail.com,,Languages: Turkish,former-student,115,115
Nargiza,Kuvanova,nargizamaratuni@gmail.com,,Languages: Russian,alumni,115,115
Luisa,Lopez,llopez@sycuanmed.org,,Languages: Spanish,former-student,115,115
Michelle,Louis,michelle_theano@hotmail.com,,"Languages: Spanish,Creole",former-student,115,115
Minouche,Merise,bminouche_7@yahoo.com,,Languages: Kreyol,former-student,115,115
Samantha,Montes,samimontes11@gmail.com,,Languages: Spanish,alumni,115,115
Angelica,Nunez,anunez@sycuanmed.org,,Languages: Spanish,former-student,115,115
Claudia,Rabe,imcrabe@aol.com,,Languages: Spanish,alumni,115,115
Aidan,Renard,stevefox0104@gmail.com,,Languages: Haitian-creole,former-student,115,115
Betzabeth,Reyes,betzabethrjc@gmail.com,,Languages: Spanish,former-student,115,115
Victor,Saenz,victorsaenz92@gmail.com,,Languages: Spanish,former-student,115,115
Obny,Saint Jean,kklovedada@gmail.com,,Languages: Haitian creole,alumni,115,115
John,Wegmann,john.wegmann@gmail.com,,Languages: Spanish,alumni,115,115
Sheau Yun,Wu,shiuewu123@gmail.com,,Languages: Mandarin,alumni,115,115
Khamla,Yotthavong,ctamerica28@gmail.com,,Languages: Lao,former-student,115,115
Sahra J,Castilla Suarez,scastillasuarez@gmail.com,,Languages: Spanish,alumni,114,114
Felipe,Contreras,felipecontreras024@gmail.com,,Languages: Spanish,former-student,114,114
Katya,Cruz,katyafcruz08@gmail.com,,Languages: Spanish,alumni,114,114
Madina,Dedakhanova,dadakhanova95@bk.ru,,Languages: Russian and Uzbek,former-student,114,114
Livenie,Ellis,livenieellis@gmail.com,,Languages: Kreyol,former-student,114,114
Aida,Gonzalez,aegonzalez18@gmail.com,,Languages: Spanish,alumni,114,114
Norma,Guitron,norma.guitron@gmail.com,,Languages: Spanish,alumni,114,114
Zoua,Her,h.zoua23@gmail.com,,Languages: Hmong,alumni,114,114
Karla,Hernandez,kph83@yahoo.com,,,former-student,114,114
Andreia,James,anolivepsi@gmail.com,,Languages: Portuguese,alumni,114,114
Renee,Lin,reneelina2@gmail.com,,Languages: Chinese,alumni,114,114
Karla,Mendez,vmendgam777@gmail.com,,Languages: Spanish,former-student,114,114
Marisela,Shumway,salcedo.mari23@gmail.com,,Languages: Spanish,former-student,114,114
Angela,Touma,angelatouma28@gmail.com,,Languages: Russian,former-student,114,114
Steeve,Yokhanna,steevsami3@gmail.com,,"Languages: Arabic, Assyrian",former-student,114,114
Nefuz,Ashkar,nefuzashkar@gmail.com,,Languages: Arabic,alumni,113,113
Claudia,Bouloup mabo,irenenadinebouloupmabo@gmail.com,,Languages: Spanish/French,alumni,113,113
Karla,Campos,mishellcampos@yahoo.com,,Languages: Spanish,alumni,113,113
Juana,Cotq,j8cota9hernandez@gmail.com,,Languages: Spanish,alumni,113,113
Bruna,Do Nascimento,rodriguesbruna1992@gmail.com,,Languages: Portuguese,former-student,113,113
Rosalba,Garibay,rosalba.garibay@thresholds.org,,Languages: Spanish,former-student,113,113
Maricela,Gomez Tinoco,mtinocor@gmail.com,,Languages: Spanish,alumni,113,113
Fatima,Jafari,fatima.jafari1364@gmail.com,,Languages: Dari,former-student,113,113
Mary,Juarez,marylj27@gmail.com,,Languages: Spanish,alumni,113,113
Tetiana,Kolomoiets,arvenus251978@gmail.com,,"Languages: Ukrainian, Russian",alumni,113,113
Nizahat,Mahdawi,nizahat.mahdawi4455@gmail.com,,Languages: Dari and farsi,alumni,113,113
Dalila,Mejorado,lilinga71@icloud.com,,Languages: Spanish,alumni,113,113
Sayed Nasir,Naqshbandi,nasir.kmu@gmail.com,,,alumni,113,113
Daphney,Noel,daphneydumay82@gmail.com,,Languages: Creole and French,alumni,113,113
Nicole,Norway,nickynorwayy@gmail.com,,Languages: Spanish,former-student,113,113
Mayra,Orozco,15.glezm@gmail.com,,Languages: Spanish,alumni,113,113
Melissa,Ortiz,melissatovar889@yahoo.com,,Languages: Spanish,alumni,113,113
Marc,Pierre,marc.pierre305@gmail.com,,Languages: Haitian Creole,former-student,113,113
Carla,Piske,carlapiske@gmail.com,,Languages: Portuguese,former-student,113,113
Maria,Ponce,mari-smiles@hotmail.com,,Languages: Spanish,former-student,113,113
Jeannette,Ramirez,jean.ramirez0795@gmail.com,,Languages: Spanish,alumni,113,113
Jennifer,Recinos,recinosalcantarajk@gmail.com,,Languages: Spanish,former-student,113,113
Maryam,Sawaby,maryamii.816@gmail.com,,Languages: Dari,alumni,113,113
Kobra,Soltani,k.soltani786@gmail.com,,Languages: Dari,former-student,113,113
Vu Nhat Hao,Thai,hao9926@gmail.com,,Languages: Vietnamese,former-student,113,113
Maria Azucena,Vazquez Navarro,mari.vn0409@gmail.com,,,alumni,113,113
Araceli,Acahua,acahuaaraceli2222@gmail.com,,Languages: Spanish,former-student,112,112
Reikhan,Alieva,reyhanalieva0@icloud.com,,"Languages: Russian, Turkish",former-student,112,112
Pedro,Alves Mendes,pedroalvesmendes@gmail.com,,Languages: Portuguese,alumni,112,112
Abeer,Badra,abeerbadra5@gmail.com,,Languages: Arabic,alumni,112,112
Sofia,Beltran,sofiabeltran180@gmail.com,,Languages: Spanish,alumni,112,112
Sabrina,Castro,scastro@sycuanmed.org,,Languages: Spanish,former-student,112,112
Yamilex,Chavez Rendon,keilany.yamilex@yahoo.com,,Languages: Spanish,former-student,112,112
Noah,Clemens,noahclemens54321@gmail.com,,Languages: Spanish,alumni,112,112
Stephanie,Cortes,stephaniecortes2005@gmail.com,,Languages: Spanish,alumni,112,112
Ana Karina,Cuéllar Montes,anikarina22@gmail.com,,Languages: Spanish,alumni,112,112
ThanhThao,Dang,taradang22@gmail.com,,Languages: Vietnamese,alumni,112,112
Maxwell,Davis,davismskate@gmail.com,,Languages: Spanish,alumni,112,112
Jasmin,Gonzalez,jasmin.f1.gonzalez@gmail.com,,Languages: Spanish,former-student,112,112
Norma,Gutierrez De Bolanos,normarealtor77@gmail.com,,Languages: Spanish,alumni,112,112
Amelia,Huaringa,ameliahuaringa@gmail.com,,Languages: Spanish,alumni,112,112
Leger,Jean-Pierre,hismercy4all@gmail.com,,Languages: Haitian Creole/French,former-student,112,112
Sandy,Lopez,lizethlopez215@gmail.com,,Languages: Spanish,alumni,112,112
Noelia,Maria,noeliamaria1020@icloud.com,,Languages: Spanish,former-student,112,112
Ana Luiza,Marino,marinoanaluiza16@gmail.com,,Languages: Portuguese,alumni,112,112
Raymundo,Mendoza,ray257@icloud.com,,Languages: Spanish,former-student,112,112
Aung,Min,azmctz@gmail.com,,Languages: Burmese,former-student,112,112
Katie,Moncada,katie.miryan@gmail.com,,Languages: Spanish,former-student,112,112
Katheryne,Morales,katherynem@outlook.com,,Languages: Spanish,alumni,112,112
Louise,Mucci,louisemucci158@gmail.com,,Languages: French,alumni,112,112
Anna,Najera,anajera@sycuanmed.org,,Languages: Spanish,former-student,112,112
Alexandra,Renteria,alexr6206@gmail.com,,Languages: Spanish,former-student,112,112
Glenda,Reyes,glennreyes487@gmail.com,,Languages: Spanish,former-student,112,112
Rebecca,Ritchey,beccalee1213@verizon.net,,,former-student,112,112
Rodrigo,Rivas,rodrigorivasnic@gmail.com,,Languages: Spanish,former-student,112,112
Evelin,Samol,toj.oreosevelin@gmail.com,,Languages: Spanish,former-student,112,112
Katerin,Toj,kathytoj9080@gmail.com,,Languages: Spanish,former-student,112,112
Luis,Uribe,uluis376@gmail.com,,Languages: Spanish,alumni,112,112
Amal,Zayed,amalzayed8@gmail.com,,Languages: Arabic,alumni,112,112
Maria,Carcamo,gatita8@live.com,,Languages: Spanish,former-student,111,111
Jancilia,Cox,jancilia1989@gmail.com,,Languages: Haitian Creole,former-student,111,111
Alejandra,Ferro,mansanafc@gmail.com,,Languages: Spanish,alumni,111,111
Nallely,Garcia,opulencegarcia@gmail.com,,Languages: Spanish,alumni,111,111
Claudia,Hernandez,claudia.hernandez9011@gmail.com,,Languages: Spanish,alumni,111,111
Yadira,Ismael Sotomayor,ismaelyadira1@gmail.com,,Languages: Spanish,alumni,111,111
Simonia,Loguiwa Ndjounga,simoniandjounga@gmail.com,,Languages: French,former-student,111,111
Nicole,Malonga,nkmalonga@aol.com,,Languages: French,former-student,111,111
Heritier,Maponda,hericomlorenzo@gmail.com,,Languages: French,former-student,111,111
Raquel,Martinez,rmiranda59@hotmail.com,,Languages: Spanish,former-student,111,111
Angelica,Navarro,navarro.a2604@gmail.com,,Languages: Spanish,alumni,111,111
Joseph,Alexis,josephalexiss@gmail.com,,Languages: Haitian Creole and French,former-student,110,110
Julian,Arvizu,arvizuluisj@gmail.com,,Languages: Spanish,alumni,110,110
Jessica,Avalos,jessica.avalos01@yahoo.com,,Languages: Spanish,alumni,110,110
Rumrada,Bunchaloemsak,rumradabun@gmail.com,,Languages: Thai,former-student,110,110
Tatiana,Cruz Romero,naifetcr@gmail.com,,Languages: Spanish,alumni,110,110
Elvia,Flores,floreselvia0@gmail.com,,Languages: Spanish,alumni,110,110
Azucena,Gamez,susiemtz2005@gmail.com,,Languages: Spanish,former-student,110,110
Teodora,Hascheff,teodoratanasescu@hotmail.com,,Languages: Spanish,alumni,110,110
Andi,Hernandez,ajeanette278@gmail.com,,Languages: Spanish,former-student,110,110
Daria,Kozuch,kozuchdaria@gmail.com,,Languages: Polish,alumni,110,110
Junior Eddy,Macajoux,junioreddymacajoux319@gmail.com,,"Languages: Haitian creole, French, Spanish",former-student,110,110
San Juanita,Martinez,janiemtz05@hotmail.com,,Languages: Spanish,former-student,110,110
Guadalupe,Martinez,guadalupemartinez1989@outlook.com,,Languages: Spanish,former-student,110,110
Aidee,Martinez,aidee.martinez2016@gmail.com,,Languages: Spanish,former-student,110,110
Emilie,Moise,emiliem0325@gmail.com,,Languages: Haitian Creole,alumni,110,110
Perla,Sanchez,perlaaatorres@gmail.com,,Languages: Spanish,former-student,110,110
Rocio A,Sanchez,sanchez.anahi95@gmail.com,,Languages: Spanish,former-student,110,110
Shahela,Sumaiya,shahela1153@gmail.com,,Languages: Bangali,former-student,110,110
Jeph,Thomas,thomasjeph77@gmail.com,,Languages: Haitian creole,alumni,110,110
Lis,Torres,fabit57@gmail.com,,Languages: Spanish,former-student,110,110
DaMonika,Washington,damonikawashington@gmail.com,,Languages: Spanish,former-student,110,110
Josiah,Woody,josiahwoody12@gmail.com,,Languages: Spanish,former-student,110,110
Lisbet,Baldovinos,lisbet.baldovinos@icloud.com,,Languages: Spanish,former-student,109,109
Friend,Correa,grneyetwin2@hotmail.com,,Languages: Spanish,alumni,109,109
Maxime,Estime,maxestime98@gmail.com,,"Languages: Haitian Creole, French",former-student,109,109
Emmanuel,Exantus,xatidesign81@gmail.com,,Languages: Creole,alumni,109,109
Tatiana,Golovina,korni105@yahoo.com,,Languages: Russian,alumni,109,109
Jason,Grullon,grullonj@upstate.edu,,Languages: Spanish,former-student,109,109
Hay,Mar,thandar946@gmail.com,,Languages: Burmese,former-student,109,109
Hana,Marhoum,hanamarhoum82@gmail.com,,Languages: Arabic,alumni,109,109
Darién,Mesa,darienrene.cm@gmail.com,,Languages: Spanish,alumni,109,109
Angel,Miranda,angelmiranda1536@hotmail.com,,Languages: Spanish,alumni,109,109
Juan,Monjarrez,jjmonjarrez@gmail.com,,Languages: Spanish,alumni,109,109
Severo,Montes,rbkick@gmail.com,,Languages: Spanish,alumni,109,109
Isabella,Mroczek,isee2003@gmail.com,,Languages: Polish,alumni,109,109
Sreysros,Pech,sros92.pech@gmail.com,,Languages: Khmer,alumni,109,109
Badam,Sawari,sarwaribadam@gmail.com,,Languages: Dari,alumni,109,109
Evaristo R,Solano Camacho,evaristo_solano@hotmail.com,,Languages: Spanish,former-student,109,109
Wai-Ling,Tam,waitam3@yahoo.com,,Languages: Cantonese,former-student,109,109
Hildania,Torres,htorres2408@gmail.com,,Languages: Spanish,former-student,109,109
Noemi,Viveros Guzman,noemi_viverosg@yahoo.com,,Languages: Spanish,former-student,109,109
Amarili,Alvarez,nycparent07@gmail.com,,Languages: Spanish,alumni,108,108
Kensley,Blanc,blanckensley77.7@gmail.com,,Languages: Haitian Creole,former-student,108,108
Miranda,Boes,mboes97@gmail.com,,Languages: ASL,alumni,108,108
Isabel,Cansino Sosa,cansinososa@gmail.com,,Languages: Spanish,alumni,108,108
Christopher,Cardoso,business.ccardoso@gmail.com,,Languages: Spanish,former-student,108,108
Barbara,Cervantes,blwbarbara@gmail.com,,Languages: Spanish,former-student,108,108
Sarah,Davidson,mounzenze97@gmail.com,,Languages: French,alumni,108,108
Giovanna,Gina Heanue,giova.gina.h@gmail.com,,Languages: Spanish,former-student,108,108
Paula,Gomez,paulis-andrea@live.com,,Languages: Spanish,former-student,108,108
Valentina,Gomez,valenes22@gmail.com,,Languages: Spanish,alumni,108,108
Maria,Gonzalez,valentinamaria2021@icloud.com,,Languages: Spanish,former-student,108,108
Grace,Granado,graciebellegranado@icloud.com,,Languages: Spanish,former-student,108,108
Margaret,Grosh,margaret.grosh@gmail.com,,Languages: Spanish,alumni,108,108
Rania,Hamzeh,raniahamzeh13@gmail.com,,Languages: Arabic,alumni,108,108
Abdul Hameed,Hashimi,hashimi.mofa@gmail.com,,Languages: Farsi/Dari,alumni,108,108
Sodaba,Mansori,sodaba.mansori@gmail.com,,Languages: Dari,former-student,108,108
Jacqueline,Marquez,jmarqu35@illinois.edu,,Languages: Spanish,former-student,108,108
Evens,Michelin,evens_michelin@comcast.net,,Languages: Creole,former-student,108,108
Karen,Morales Coyotl,karenmocoyotl@gmail.com,,Languages: Spanish,alumni,108,108
Hagar,Moussa,hagarmoussa88@gmail.com,,Languages: Arabic,former-student,108,108
Abril,Pacheco,msabril_sc@yahoo.com,,Languages: Spanish,former-student,108,108
Johanna,Parker Brownwell,johannabrownwell@yahoo.com,,Languages: Spanish,alumni,108,108
Hugues Richard,Pascal,huguesrichardpascal5@gmail.com,,"Languages: Spanish, French and Creol",former-student,108,108
Melissa,Perez,mperez0599@gmail.com,,Languages: Spanish,alumni,108,108
Nancy,Reyes,nancyreyes166@gmail.com,,Languages: Spanish,alumni,108,108
Ivan Basilio,Robaina Bychko,ivan.robaina.bychko@gmail.com,,Languages: Spanish,alumni,108,108
Derek,Tyson,dmcct59@gmail.com,,Languages: Spanish,former-student,108,108
Alexis,Villegas,avillegas.mehs@gmail.com,,Languages: Spanish,alumni,108,108
Shahd,Ahmed,shahdosama5@gmail.com,,Languages: Arabic,alumni,107,107
Jean Phares,Beaucejour,bemhaiti@gmail.com,,Languages: French and Haitian Creole,former-student,107,107
Ana Victoria,Byrd,marrugovictoria2103@gmail.com,,Languages: Spanish,former-student,107,107
Juvie,Cervantes,juviecervantez17@gmail.com,,Languages: Spanish,alumni,107,107
Zaelys,Delgado,zaeliz@hotmail.com,,Languages: Spanish,former-student,107,107
Desiree,Druecker,desireedruecker@live.com,,Languages: Spanish,alumni,107,107
Paula,Guerrero,lorena21guerrero@outlook.com,,Languages: Spanish,former-student,107,107
Mario,Interiano,m.interiano11@gmail.com,,Languages: Spanish,alumni,107,107
Keylina,Jose,keylinajosepolanco@gmail.com,,Languages: Spanish,former-student,107,107
Arnib,Labib,arniblabib@yahoo.com,,Languages: Bangla,former-student,107,107
Yara,Lira Pena,yarapena6371@gmail.com,,Languages: Spanish,alumni,107,107
Yelena,Lutsenko,yelena12323@gmail.com,,Languages: Russian,alumni,107,107
Truc,Mai,michelle.mai04@gmail.com,,,alumni,107,107
Rohullah,Matin,rohullahmatin47@gmail.com,,Languages: Dari and Pashto,former-student,107,107
Pedro,Medina,pedro@aalb.org,,Languages: Spanish,former-student,107,107
Becky Meliza,Mendoza Cruz,mendozabecky190@gmail.com,,Languages: Spanish,alumni,107,107
Lorena,Murillo,faith1life@gmail.com,,Languages: Spanish,former-student,107,107
Mei,Ng,iceng898@gmail.com,,Languages: Cantonese and Mandarin,alumni,107,107
David,Perez,dpbusiness49@gmail.com,,Languages: Spanish,alumni,107,107
Erika,Rodriguez,erikarod1017@gmail.com,,Languages: Spanish,former-student,107,107
Zahra,Sabet Nam,z.sabetnam@gmail.com,,Languages: Farsi,alumni,107,107
Angisselle,Suarez,angisuarez102798@gmail.com,,Languages: Spanish,alumni,107,107
Lamine,Thiam,lathiam3@gmail.com,,Languages: French and Wolof,former-student,107,107
Kerryn,Torres,kcaste0523@gmail.com,,Languages: Spanish,former-student,107,107
Linh,Truong,tuonglinhsgu@gmail.com,,Languages: Vietnamese,alumni,107,107
Maison,Andrawos,maisoon.alaqeeli@gmail.com,,Languages: Arabic,alumni,106,106
Silvia,Aninye,silvia@weberlegalnurse.com,,Languages: German,alumni,106,106
Jorge,Araujo,jorge.araujo19127@gmail.com,,Languages: Spanish,former-student,106,106
Marc,Augustin,maugustin@mercy.com,,Languages: Haitian Creole,former-student,106,106
Antonio,Avila,flashfire1565@gmail.com,,Languages: Spanish,alumni,106,106
Dilber,Babamuradova,dilyushababamuradova@gmail.com,,Languages: Russian Turkmen,alumni,106,106
Carter,Brant,carterb427@icloud.com,,Languages: Spanish,former-student,106,106
Jean Levaillant,Castelly,castellylevaillant93@gmail.com,,Languages: Haitian Creole,former-student,106,106
Joseline,Cruz Vazquez,joseline.cruz1@gmail.com,,Languages: Spanish,alumni,106,106
Hayden,Davis,haydenedavis49@gmail.com,,Languages: Spanish,former-student,106,106
Giovani,de Oliveira Mota Filho,giosilusa@fastmail.fm,,Languages: Portuguese,former-student,106,106
Graciela,Diaz,gracie_d9@yahoo.com,,Languages: Spanish,former-student,106,106
Miriam Patricia,Farias Jimenez,farias.miriam3@gmail.com,,Languages: Spanish,alumni,106,106
Samira,Ferrando,s.ferrando21@gmail.com,,Languages: Spanish,alumni,106,106
Yadira,Gomez,celiayayis@yahoo.com,,Languages: Spanish,former-student,106,106
Julia,Linares,bruuno0214@gmail.com,,Languages: Spanish,former-student,106,106
Ya-Hui,Liu,galaxyhui0107@gmail.com,,Languages: Mandarin,alumni,106,106
Maria,Lopez,mariavaldez070707@gmail.com,,Languages: Spanish,former-student,106,106
Miranda,Morales,morales.mira20@gmail.com,,Languages: Spanish,alumni,106,106
Snow,Nguyen,nguyensnow329@yahoo.com,,Languages: Vietnamese,former-student,106,106
Reyna,Ponce,beafigueroa1389@gmail.com,,Languages: Spanish,alumni,106,106
Maria,Reinoso Engstrom,maria297idabel@gmail.com,,Languages: Spanish and Creole,alumni,106,106
Amour,Toura-Gaba,a.toura-gaba@att.net,,Languages: French,alumni,106,106
Emma,Vasquez,emavqz@gmail.com,,Languages: Spanish,former-student,106,106
Andrea,Walzel,andrea.walzel@outlook.com,,Languages: German,alumni,106,106
Lilit,Amiryan,lilitamiryany@gmail.com,,Languages: Armenian,former-student,105,105
Gustavo,Chavez,u2012122828@gmail.com,,Languages: Spanish,former-student,105,105
Loan,Do,loando2@gmail.com,,Languages: Vietnamese,alumni,105,105
Klementyna,Duda,kjpola013@gmail.com,,Languages: Polish,former-student,105,105
Tracy,Elie,strong.queen_75@yahoo.com,,Languages: Haitian Creole,alumni,105,105
Davelle,Felder,felder.davelle@gmail.com,,Languages: Spanish,former-student,105,105
Luis,Gonzalez,lhomergonz@gmail.com,,Languages: Spanish,alumni,105,105
Yesica,Hernandez,yesica.hernandez6@gmail.com,,Languages: Spanish,alumni,105,105
Palomano,Joseph,palomanojoseph@gmail.com,,Languages: Haitian Creole,alumni,105,105
Tahsin,Labib,labib.tahsin@gmail.com,,Languages: Bangla,alumni,105,105
Zoe,Lapp,zoe.lappcsepeli@gmail.com,,Languages: French and Hungarian,alumni,105,105
Kendry,Leon Guarner,guarner.kendryyg@gmail.com,,Languages: Spanish,alumni,105,105
Layssa,Macedo,layssama05@gmail.com,,Languages: Portuguese,alumni,105,105
Eva,Marti Abellan,evamarti21498@icloud.com,,Languages: Spanish,former-student,105,105
Francisco,Muriel,franciscoj41330@gmail.com,,Languages: Spanish,alumni,105,105
Connor,ONeil,connorchicago77777@gmail.com,,Languages: Spanish,alumni,105,105
Santhia,Osias,synderlie712@gmail.com,,"Languages: Spanish, Creole,French",alumni,105,105
Leslie,Pelaez,lesliepelaez0@gmail.com,,Languages: Spanish,alumni,105,105
James,Rinchere,jrinchere@yahoo.com,,Languages: Haitian Creole,alumni,105,105
Myrine,Robedeaux,labskosila2@gmail.com,,Languages: Filipino,former-student,105,105
Maria,Rodriguez-Franco,bermanm921@gmail.com,,Languages: Spanish,alumni,105,105
Brittany,Salgado,britsal0319@gmail.com,,Languages: Spanish,alumni,105,105
Elsa,Silva de Jackson,jacksonelsa75@gmail.com,,Languages: Spanish,alumni,105,105
Kesny,St Louis,lagrange4christ@gmail.com,,Languages: Haitian Creole,former-student,105,105
Kaxandra,Tapia,kaxandra.tapia.campos@gmail.com,,Languages: Spanish,alumni,105,105
Hugo,Tarquino,hjunior96096@gmail.com,,Languages: Spanish,former-student,105,105
Lynette,Torres Colón,lynette3536@gmail.com,,Languages: Spanish,alumni,105,105
Guerson,Vital,vitalguerson@yahoo.com,,Languages: Creole,alumni,105,105
Cynthia,Willett Gutierrez,cynthiawillettg@gmail.com,,Languages: Spanish,alumni,105,105
Iwona,Wysocki,iwonawysocki04@gmail.com,,Languages: Polish,alumni,105,105
Olga,Aguirre,olga_aguirre82@yahoo.com,,Languages: Spanish,former-student,103,103
Karen,Arriaga,arriagakaren@yahoo.com,,Languages: Spanish,former-student,103,103
Carmen,Barrios,danielbarrios107@yahoo.com,,Languages: Spanish,alumni,103,103
Svitlana,Bitaraes,svitlanafowler@gmail.com,,"Languages: Ukrainian, Russian",alumni,103,103
Olivia,Bordelois,oliviabordelois@gmail.com,,Languages: Spanish,former-student,103,103
Mayela,Cardona,cardona7347@gmail.com,,Languages: Spanish,former-student,103,103
Mirna,Chavarin,mirnachava@gmail.com,,Languages: Spanish,alumni,103,103
Fatima,Chioukh,chioukh.fatima94@gmail.com,,Languages: Arabic,alumni,103,103
Jo,Cortes,jocortes2424@gmail.com,,Languages: Spanish,alumni,103,103
Wendy,Echeverry,wjecheverry@yahoo.com,,Languages: Spanish,alumni,103,103
Jose Jesus,Fuentes Loya,fuentes_josej@yahoo.com,,Languages: Spanish,former-student,103,103
Estrella,Gancedo Gordillo,estrella.gancedo@gmail.com,,Languages: Spanish,alumni,103,103
Georgina,Guerrero,gguerrerogalvan@gmail.com,,Languages: Spanish,alumni,103,103
Kevin,Guillen,gioflores2003@gmail.com,,Languages: Spanish,alumni,103,103
Luis,Hernandez,luishernandez23725@gmail.com,,Languages: Spanish,former-student,103,103
Abdirahman,Ismail,yamismail1989@gmail.com,,Languages: Amharic,alumni,103,103
Ghalia,Keftaro,ghaliakeftaro@yahoo.com,,Languages: Arabic,alumni,103,103
Skyler,Luo,skyler_lau@icloud.com,,Languages: Mandarin Chinese,alumni,103,103
Sherly,Math-Osagie,sherlycheristin@rocketmail.com,,Languages: Hatian Creole,former-student,103,103
Zachary,May,zaczac198@gmail.com,,Languages: Spanish,former-student,103,103
Johnnathan,Melendez,johnnathan.melendez94@gmail.com,,Languages: Spanish,former-student,103,103
Klaudia,Miraka,klaudiamiraka99@gmail.com,,"Languages: Albanian,Greek",alumni,103,103
Sherly,Pagan Navarro,sherly.pagan@yahoo.com,,Languages: Spanish,former-student,103,103
Sebastian,Rojas Perez,sebastian_rojas@me.com,,Languages: Spanish,alumni,103,103
Janet,Rolon,rolonjanet@yahoo.com,,Languages: Spanish,former-student,103,103
Karla,Silva,kasilva21@coe.edu,,Languages: Spanish,former-student,103,103
Joraida,Stewart,joryperez252627@gmail.com,,Languages: Spanish,alumni,103,103
Karline,Sylvestre,ksylvestre1969@gmail.com,,Languages: Creole,alumni,103,103
Rebecca,Alvarenga,ralvarenga@gencomhealth.org,,Languages: Portuguese,former-student,102,102
Alessandro,Colina Garcia,chandro.coga@gmail.com,,Languages: Spanish,alumni,102,102
Darelys,Correa Huertas,dare.09.nextps@gmail.com,,Languages: Spanish,alumni,102,102
Sagrario,Farrell,sargie72@gmail.com,,Languages: Spanish,former-student,102,102
Y Nhu,Fisher,ynhuluong0618@gmail.com,,Languages: Vietnamese,alumni,102,102
Maria Fernanda,Flores Rios,fernanda.frios30@gmail.com,,Languages: Spanish,former-student,102,102
Emanuel,Garcia-Tellez,mannygt80@gmail.com,,Languages: Spanish,alumni,102,102
Galyna,Golyshevska,galynamelnik1@gmail.com,,"Languages: Ukrainian, Russian",alumni,102,102
Rhen,Llevado,rhenllevado@gmail.com,,Languages: Tagalog,alumni,102,102
David,Lohman,odessa1611@gmail.com,,Languages: Russian,alumni,102,102
Damaris,Luna-Sanchez,luna201313@gmail.com,,Languages: Spanish,former-student,102,102
Jose,Mejia,joseciito21@yahoo.com,,Languages: Spanish,former-student,102,102
Yazmin,Miranda,yazmintwin1@gmail.com,,Languages: Spanish,alumni,102,102
Sadie Cassandra,Moreno Quijada,morenocassandra96@gmail.com,,Languages: Spanish,alumni,102,102
Mariana,Pena,mpatmarianna@gmail.com,,Languages: Spanish,alumni,102,102
Juan,Prudencio Soligno,juan.prudenciosol@gmail.com,,Languages: Spanish,alumni,102,102
Yessica,Rodriguez Chino,rodriye2013@gmail.com,,Languages: Spanish,alumni,102,102
Radharani,Sonnathi,radhasonnathi@gmail.com,,Languages: Telugu,alumni,102,102
Dora L,Toledo Antunez,toledo.dora112@gmail.com,,Languages: Spanish,alumni,102,102
Jeimi,Vazquez,jeimivazauez0@gmail.com,,Languages: Spanish,former-student,102,102
Estefany,Vazquez,estefanyvazquez911@gmail.com,,Languages: Spanish,alumni,102,102
Miriam,Villagomez,mirlobos@icloud.com,,Languages: Spanish,former-student,102,102
Karla,Zapata,kzapata230@outlook.com,,Languages: Spanish,former-student,102,102
Maria Fernanda,Aguirre,fersophzur@gmail.com,,Languages: Spanish,alumni,101,101
Bigenson,Altidor,bigenson22@icloud.com,,Languages: French,alumni,101,101
Joycelyn,Avilez,javilez29@yahoo.com,,Languages: Spanish,alumni,101,101
Salvador,Bobadilla,salvador.bobadilla111@gmail.com,,Languages: Spanish,alumni,101,101
Laura,Brinez Camacho,laura.brinez@hotmail.com,,Languages: Spanish,former-student,101,101
Cielo,Ceballos,cieloceballos58@gmail.com,,Languages: Spanish,alumni,101,101
Thang,Dao,haiquan54321@yahoo.com,,Languages: Vietnamese,former-student,101,101
Baneza,Escalante Roblero,banesc27@gmail.com,,Languages: Spanish,alumni,101,101
Jezibel,Escobar,jezibelescobar@icloud.com,,Languages: Spanish,former-student,101,101
Julian,Favela,julianfavela7@gmail.com,,Languages: Spanish,alumni,101,101
Ablawa,Favi,deograciasfavi@gmail.com,,Languages: French,alumni,101,101
Luz,Flores,floreslucy61@yahoo.com,,Languages: Spanish,former-student,101,101
Hannah,Grullon,hannahgrullon2004@gmail.com,,Languages: Spanish,alumni,101,101
Gihan,Helmy,gigikh260@gail.com,,Languages: Arabic,former-student,101,101
Jessica,Hernandez,jessicahernandezvenzor1998@gmail.com,,Languages: Spanish,alumni,101,101
Jisoo,Jeong,jicasso.art@gmail.com,,Languages: Korean,former-student,101,101
Daljeet,Johal,daljeetjohal2012@gmail.com,,Languages: Punjabi,former-student,101,101
Nahyeon,Kim,nkimhome123@gmail.com,,Languages: Korean,alumni,101,101
Haydee,Maldonado,haydeemaldonado7@gmail.com,,Languages: Spanish,alumni,101,101
Isabella,Mc Ginn,isabellamcginn@hotmail.com,,Languages: Portuguse,former-student,101,101
René,Meza Segura,renerolero@gmail.com,,Languages: Spanish,former-student,101,101
Su Young,Nam,synam2128@gmail.com,,Languages: Korean,alumni,101,101
Patricia,Oliveira,poliveira92@hotmail.com,,Languages: Portuguese,alumni,101,101
Yasmin,Oliveira Cruz,yasmin.o.cruz5@gmail.com,,Languages: Portuguese and Spanish,alumni,101,101
Eunice,Padilla,eunicepadilla94@gmail.com,,Languages: Spanish,former-student,101,101
Tamilee,Perez,tamileep.16@gmail.com,,Languages: Spanish,alumni,101,101
Lucia,Rodriguez,rodriguezlucia479@yahoo.com,,Languages: Spanish,former-student,101,101
Ixa Melany,Santiago Velazquez,ixasantiago@gmail.com,,Languages: Spanish,alumni,101,101
Nicole,Vedia,nicky_vedia@hotmail.com,,Languages: Spanish,alumni,101,101
Kaleb,Williams,kaber.willie515@gmail.com,,Languages: Spanish,alumni,101,101
Shafina,Alam,shafina.alam.eee@gmail.com,,Languages: Bengali,alumni,100,100
Seham,Alhanafi,sehamhanafi2022@gmail.com,,Languages: Arabic,former-student,100,100
Adela,Arzola,adelaame@yahoo.com,,Languages: Spanish,former-student,100,100
Roosevelt,Bastien,bastienroosve@gmail.com,,Languages: Haitian Creole,alumni,100,100
Leslie,Calderon,elle.kcg@outlook.com,,Languages: Spanish,former-student,100,100
Johanna,Garcia,johagarcia19@yahoo.com,,Languages: Spanish,former-student,100,100
Jose,Gonzalez,especialjr21@gmail.com,,Languages: Spanish,alumni,100,100
Irasema,Gutierrez,irasemagutierrez05@gmail.com,,Languages: Spanish,former-student,100,100
Itzel I.,Infante Magana,ivanovainfante@gmail.com,,Languages: Spanish,alumni,100,100
Honey,Isaro,isarohoney@gmail.com,,Languages: French,alumni,100,100
Kevin,Lemus,lemusfa3@gmail.com,,Languages: Spanish,former-student,100,100
Joshua,Lerman,jlerm03@gmail.com,,Languages: Spanish,former-student,100,100
Minyuan,Lu,luminyuan2008@gmail.com,,Languages: Mandarin,alumni,100,100
Jennifer,Marvel,jmarvel@crescentchc.org,,Languages: Spanish,former-student,100,100
Monica,Mendoza,monicamendozaa84@gmail.com,,Languages: Spanish,former-student,100,100
Blanca,Nava Gonzalez,gonzalezby91@gmail.com,,Languages: Spanish,alumni,100,100
Jackeline,Ochoa,jackelineochoa1204@gmail.com,,Languages: Spanish,former-student,100,100
Evelyn,Ortiz,eortiz@crescentchc.org,,Languages: Spanish,former-student,100,100
Nar,Rasaily,nareshsathi9@gmail.com,,,former-student,100,100
Ilona,Roshe,ilona.roshe@gmail.com,,Languages: Rusian/Ukranian,alumni,100,100
Gabriela,Sanchez,sanchezgz@outlook.com,,Languages: Spanish,former-student,100,100
Curtis,Turney,curtisturn13@yahoo.com,,Languages: Spanish,former-student,100,100
Andres,Vegas,aevg789@gmail.com,,Languages: Spanish,alumni,100,100
Beatriz,Villanueva,bavillanueva925@gmail.com,,Languages: Spanish,former-student,100,100
Ahmad Muqadas,Aazem,ahmadmuqadas.98@gmail.com,,Languages: Farsi,former-student,99,99
Amanda,Amador Chi,amandamadorchi@gmail.com,,Languages: Spanish,alumni,99,99
Alison,Ambrosio,aliambrosio3@gmail.com,,Languages: Spanish,alumni,99,99
Shireen,Awwad,shireen1981@icloud.com,,Languages: Arabic,former-student,99,99
Hameed,Bakhtani,bakhtani.hameed@gmail.com,,Languages: Dari,former-student,99,99
Estefania,Baray,estefaniabaray1@gmail.com,,Languages: Spanish,former-student,99,99
Samuel,Bonatoute,bsbiensage@gmail.com,,Languages: Haitian Creole,alumni,99,99
Bryan Adonis,Carral Sanchez,bryan360424@gmail.com,,Languages: Spanish,alumni,99,99
Donato,Dorsainvil,donatodorsainvil55@gmail.com,,Languages: French,alumni,99,99
Omera,Elham,omeraelham@gmail.com,,Languages: Dari and Hindi,former-student,99,99
Teresa,Galarza,mteresag31@gmail.com,,Languages: Spanish,alumni,99,99
Sonbol,Haghshenas Kashani,sonbolkashani@gmail.com,,Languages: persian,alumni,99,99
Vincent,Karekezi,karekezivincent92@gmail.com,,Languages: Kinyarwanda,alumni,99,99
Thi,Khuyen Le,lethikhuyen111@gmail.com,,Languages: Vietnamese,alumni,99,99
Maude,Laroche,maudelaroche87@yahoo.com,,Languages: Haitian Creole,alumni,99,99
Laura,Lotero Arango,loteroarangolaura@gmail.com,,Languages: Spanish,alumni,99,99
Moutakilou,Mumuni,mumunimuta@gmail.com,,Languages: French,alumni,99,99
Alexandra,Munoz,munozalexandra49@gmail.com,,Languages: Spanish,former-student,99,99
Edwige,Narcisse,narcigg@yahoo.com,,Languages: Creole,former-student,99,99
Lupe,Ortega Torres,lupeortegat@gmail.com,,Languages: Spanish,alumni,99,99
Liana,Rojas-Diaz,reylee1997@outlook.com,,Languages: Spanish,former-student,99,99
Imelda,Valencia,valenciaimelda41@gmail.com,,Languages: Spanish,alumni,99,99
Rachelle,Balan,balanrachelle@gmail.com,,Languages: Haitian creole,alumni,98,98
Francis,Carreras,carrerasf39@gmail.com,,Languages: Spanish,alumni,98,98
Juliene,De Freitas Mazoto Jeronymo,jumazoto@hotmail.com,,Languages: Brazilian Portuguese,former-student,98,98
Truc,Eap,trucvnusa@gmail.com,,Languages: Vietnamese and Thai,alumni,98,98
Clarisa,Espinoza,catafonseca2016@gmail.com,,Languages: Spanish,alumni,98,98
Maria,Farigua,mapifarigua@yahoo.com,,Languages: Spanish,former-student,98,98
Zory,Figueroa,zfigueroa23@gmail.com,,Languages: Spanish,alumni,98,98
Adriana,Guarisma,adriana.guarisma.ag@gmail.com,,Languages: Spanish,alumni,98,98
Ana,Gutierrez,ana.gutierrez1199@gmail.com,,Languages: Spanish,alumni,98,98
Vanessa,Hernandez,love.bfgf.1@gmail.com,,Languages: Spanish,alumni,98,98
Valentina,Mendoza,val.mendoq@gmail.com,,Languages: Spanish,alumni,98,98
Miguel,Merchan,miguel.merchan32@gmail.com,,Languages: Spanish,former-student,98,98
Janick,Montesinos,janickmontesinos7@gmail.com,,Languages: Spanish,alumni,98,98
Carmen,Myerscough,doodlebug_c65@yahoo.com,,Languages: Spanish,former-student,98,98
Elizabeth,Neaves,elizabethneaves1@gmail.com,,Languages: Spanish,alumni,98,98
Enrique,"Ocon, Jr.",enriquevaquero7@gmail.com,,Languages: Spanish,alumni,98,98
Devanee,Orellana-Flores,jocelineflores28@gmail.com,,Languages: Spanish,alumni,98,98
Laura,Quintero,lauraquintero@ymail.com,,Languages: Spanish,alumni,98,98
Kellys,Reeve,kellysbless@outlook.com,,Languages: Spanish,former-student,98,98
Janeslly,Rodriguez,janesllyrodriguez@gmail.com,,Languages: Spanish,former-student,98,98
Jennifer,Schmitt,jennisschmitt12@gmail.com,,Languages: Spanish,alumni,98,98
Alexander,Silkin,alexandersilkin@icloud.com,,Languages: Russian,former-student,98,98
Cyezi N.,Steve,cyezisteve@gmail.com,,Languages: French,former-student,98,98
Mohammad Ramish,Sultani,ramishsultani62@gmail.com,,Languages: Dari,former-student,98,98
Monica,Tavares,monica.tavares19@gmail.com,,Languages: Portugese,alumni,98,98
Jessica,Troche,trochejessica@aol.com,,Languages: Spanish,former-student,98,98
Mayra,Valdivia,validiviamayra09@gmail.com,,Languages: Spanish,alumni,98,98
Angela,Aguilar,avangela3799@gmail.com,,Languages: Spanish,alumni,97,97
Nadia,Alonso,nadia.alonso.pulido@gmail.com,,,alumni,97,97
Maria,Avalos,mavalos321@yahoo.com,,Languages: Spanish,alumni,97,97
Clara Fernanda,Ayala Benitez,ayalafernanda1108@gmail.com,,Languages: Spanish,alumni,97,97
Axel,Baker,axelodst4@yahoo.com,,Languages: Spanish,former-student,97,97
Victoria,Bates,v.v.yakimova75@gmail.com,,Languages: Russian,alumni,97,97
Henry,Bello,hbello657@gmail.com,,Languages: Spanish,alumni,97,97
Melina,Castro Carrillo,melinacastro0698@gmail.com,,Languages: Spanish,alumni,97,97
Duangporn,Chaiyaporn,ammchaiyaporn@gmail.com,,Languages: Thai,former-student,97,97
Zuleyka,De Jesus Aviles,zuleykadja94@gmail.com,,Languages: Spanish,alumni,97,97
Ashley,Gallardo,gallardoashley@yahoo.com,,Languages: Spanish,former-student,97,97
Ana,Godard-Carpio,anainescarpio@gmail.com,,Languages: Spanish,alumni,97,97
Israa,Humphries,israa_humphries@yahoo.com,,Languages: Arabic,former-student,97,97
Rafaela,Jimenez,raphynjazz@yahoo.com,,Languages: Spanish,former-student,97,97
Maira,Lopez,mairacastellon32@gmail.com,,Languages: Spanish,former-student,97,97
Julinda,Maksuti,julindam@yahoo.com,,Languages: Albanian,alumni,97,97
Carmen,Mijares,xiomaramijares.cm@gmail.com,,Languages: Spanish,former-student,97,97
Ourida,Mokhtari,ouridamokhtari77@gmail.com,,Languages: French,alumni,97,97
Jesica,Patel,jesicapatel50@gmail.com,,Languages: Gujarati and Hindi,alumni,97,97
Raul,Perez,rauleljim3nez@gmail.com,,Languages: Spanish,alumni,97,97
Gabriel,Pizano,gabepizano@gmail.com,,Languages: Spanish,alumni,97,97
Kathy,Ramirez,kcro11@yahoo.com,,Languages: Spanish,former-student,97,97
Iris,Ramírez-Laffitte Rebolledo,iris.laffitte@gmail.com,,Languages: Spanish,alumni,97,97
Leticia,Richardson,nurselsrichardson@gmail.com,,Languages: Spanish,alumni,97,97
Rei,Robja,rrobja@coastal.edu,,Languages: Albanian,former-student,97,97
Bethsaida,Rosier,btsrosier@gmail.com,,Languages: Spanish and Haitian creole,former-student,97,97
Michelle,Smith,mfig75@yahoo.com,,Languages: Spanish,alumni,97,97
Amy,Tax Iraheta,amytax51@gmail.com,,Languages: Spanish,alumni,97,97
Viviana,Zuleta,vivi.zuleta.ti@gmail.com,,Languages: Spanish,alumni,97,97
Madina,Ahmadzai,madina.ahmadzai91@gmail.com,,"Languages: Pashto, Dari, Farsi and Urdu",alumni,96,96
Clemencia,Alvarado,clemenciaalvarado1998@yahoo.com,,Languages: Spanish,alumni,96,96
Gilberto,Alvarado Rojas,gilberto33al@hotmail.com,,Languages: Spanish,alumni,96,96
Ana Paula,Barros,anapaulalouvera@gmail.com,,Languages: Portuguese,former-student,96,96
Manuela,Chacin,chacinmanuela22@gmail.com,,Languages: Spanish,alumni,96,96
Aby,Diouf,abyndeyaby@gmail.com,,Languages: French/Wolof,alumni,96,96
Maria,Echeverria,mariasn2245@gmail.com,,Languages: Spanish,alumni,96,96
Norma,Gonzalez,normaygonzalez@gmail.com,,Languages: Spanish,alumni,96,96
Price,Jeremie,pjeremie@aol.com,,Languages: Haitian Creole,former-student,96,96
Gabriella,Kilroy,gabriellagabriel12@gmail.com,,Languages: Haitian Creole,alumni,96,96
Ilona,Kmit,ilonakmit96@gmail.com,,"Languages: Ukrainian, Russian",alumni,96,96
Mimi,Landa Cervantez,mimilcervantes@hotmail.com,,Languages: Spanish,former-student,96,96
Lilia Nguyen,Le,minh.le22@pcc.edu,,Languages: Vietnamese,former-student,96,96
Annamarie,Magana,annamarie.magana05@gmail.com,,Languages: Spanish,alumni,96,96
Agnieszka,Markiewicz Mazur,markiewicz.mazur@gmail.com,,Languages: Polish,alumni,96,96
Elilda,Martinez,martinezbello26@gmail.com,,Languages: Spanish,alumni,96,96
Mitra,Moghaddam,mitra209@yahoo.com,,Languages: Farsi,alumni,96,96
Juan,Morales-Mejia,juan.ma.mo.1012@hotmail.com,,Languages: Spanish,alumni,96,96
Hassebullah,Najib,hassnajib@yahoo.com,,"Languages: Dari, Pashto",former-student,96,96
Jean Robert,Nherisson,jnherisson@yahoo.com,,Languages: Haitian Creole,alumni,96,96
Julissa,Olivas,olivasjulissa26@yahoo.com,,Languages: Spanish,former-student,96,96
Daniela,Rios Reyes,dannay.reyes0209@gmail.com,,Languages: Spanish,alumni,96,96
Yarelis,Robinson,yarelis.g@yahoo.com,,Languages: Spanish,former-student,96,96
Jael,Rodriguez,rzjael07@gmail.com,,Languages: Spanish,former-student,96,96
Maria,Rose,mariarose1308@hotmail.com,,Languages: Spanish,former-student,96,96
Mirna,Saade,mirenachidiak@hotmail.com,,Languages: Arabic,alumni,96,96
Balkees,Sailany,b1ahmed@yahoo.com,,Languages: Arabic,alumni,96,96
Johanna,Salinas,salinas1975@yahoo.com,,Languages: Spanish,former-student,96,96
Jorge,Soto,19tweeter72@gmail.com,,Languages: Spanish,former-student,96,96
Kulwinder,Sra,srakulwinder@yahoo.com,,Languages: Punjabi,alumni,96,96
Magda,Wahba,magdawahba70@gmail.com,,Languages: Arabic,alumni,96,96
Juan,Zavala,juanjosezavalajr@gmail.com,,Languages: Spanish,alumni,96,96
Zuhal,Alokozai,zuhal.alokozai7@gmail.com,,Languages: Farsi,alumni,95,95
Abdoul,Aziz Seck,seckziza@gmail.com,,,alumni,95,95
FuYongLi,Chambers,fylchambers@icloud.com,,Languages: Mandarin Chinese,former-student,95,95
Nathalie,Charles,nathaliecharles80@gmail.com,,Languages: Haitian creole,alumni,95,95
Juliana,Cuartas,j64cuartas@gmail.com,,Languages: Spanish,former-student,95,95
Isabelly,De Jesus,bellynavarro7@gmail.com,,Languages: Portuguese,alumni,95,95
Biennemise,Destra,biennemisedestra@gmail.com,,Languages: Haitian creole,former-student,95,95
Lynn,Edwards II,edwardslj45@gmail.com,,Languages: Spanish,former-student,95,95
Deyni,Escalante,deynie.1972@gmail.com,,Languages: Spanish,alumni,95,95
Christopher,Gibbons,cgibbons1981@yahoo.com,,Languages: Spanish,former-student,95,95
Melissa,Gomez,melissa19.go@gmail.com,,Languages: Spanish,former-student,95,95
Marely,Hernandez,marely.hndz10@gmail.com,,Languages: Spanish,former-student,95,95
Monika,Holder,astrid777is@gmail.com,,Languages: Hungarian,alumni,95,95
Emily,Juarez,emily.juarez.9@gmail.com,,Languages: Spanish,alumni,95,95
Aaron,Layne,aaronjohnson80519@gmail.com,,Languages: Spanish,former-student,95,95
Sofia,Lercher,lerchersofia@gmail.com,,Languages: Spanish,alumni,95,95
Cinthia,Masucci,cint1284@hotmail.com,,Languages: Spanish,former-student,95,95
Naomie,Michel,michelnaomie@yahoo.com,,Languages: Haitian Creole,former-student,95,95
Arley Enrique,Morrell Consuegra,arleyenrike@gmail.com,,Languages: Spanish,alumni,95,95
Xochil,O'Neill,xochilv@gmail.com,,Languages: Spanish,alumni,95,95
Siwon,Park,dependableinterpreter@gmail.com,,Languages: Korean,alumni,95,95
Drazen,Rakanovic,dr4730@sbcglobal.net,,"Languages: Serbian,Croatian,Bosnian.",former-student,95,95
Carmina,Rodriguez,carminameza4@gmail.com,,Languages: Spanish,former-student,95,95
Joel,Rosario,joeldru1@gmail.com,,Languages: Spanish,former-student,95,95
Joanna,Rubio-Marquez,joannarubio1998@gmail.com,,Languages: Spanish,former-student,95,95
Jie,Yu,yutiti918@gmail.com,,Languages: Mandarin,alumni,95,95
Kenia,Zavala,zavalaescobar5@gmail.com,,Languages: Spanish,alumni,95,95
Alim,Zhakanov,alim.zhakanov@gmail.com,,Languages: Russian,alumni,95,95
Ani,Aghekyan,aghekyanani900880@gmail.com,,Languages: Armenian,alumni,94,94
Patrick Gesner,Augusme,patrickgesner16@gmail.com,,Languages: Spanish/ Haitian Creole,alumni,94,94
Maria,Ceballos,mariaceballos2001@gmail.com,,Languages: Spanish,alumni,94,94
Dafney,Charlemagne,neydly18@yahoo.fr,,Languages: Creole and French,former-student,94,94
Hercilia,De leon,hercitaralda@gmail.com,,Languages: Spanish,alumni,94,94
Vanda,De Sousa Silva,silvasousavanda1989@gmail.com,,Languages: Portuguese,alumni,94,94
Maria,del Pilar,pilarenglish64@gmail.com,,Languages: Spanish,former-student,94,94
Stephanie,Fraire,stephaniefraire97@gmail.com,,Languages: Spanish,former-student,94,94
Gabriela,Garcia,love.gaby.girl@gmail.com,,Languages: Spanish,alumni,94,94
Sergio A,Godinez,sergio.godinez1@hotmail.com,,Languages: Spanish,former-student,94,94
Maria Alicia,Lima,aliliva@yahoo.com,,Languages: Spanish,former-student,94,94
Hilda Maricela,Limon,jose94mari@yahoo.com,,Languages: Spanish,alumni,94,94
Sandra,Lopez,sandra.vale1580@gmail.com,,Languages: Spanish,alumni,94,94
Alexander,Makhanov,alexmaxanov@gmail.com,,Languages: Russian,alumni,94,94
Maria,Mateo,mariamateo232@gmail.com,,Languages: Spanish,alumni,94,94
Shery,Morkos,sherysamy@yahoo.com,,Languages: Arabic,alumni,94,94
Ana Abigail,Parra,abg.grc07@gmail.com,,Languages: Spanish,alumni,94,94
Abel,Perez,aperez1597@gmail.com,,Languages: Spanish,alumni,94,94
Armaghan,Pourreza,souvenir1717@yahoo.com,,Languages: Farsi,alumni,94,94
Rafael,Rivera,rafaelrz010@gmail.com,,Languages: Spanish,alumni,94,94
Liliana,Rubio gutierrez,lilyrubio3291@gmail.com,,Languages: Spanish,former-student,94,94
Daniel,Serrano,danny.serrano1@icloud.com,,Languages: Spanish,former-student,94,94
Cynthia,Sorto,cynthiasortoflores@gmail.com,,Languages: Spanish,former-student,94,94
Lydia,Vega,lyly2383@yahoo.com,,Languages: Spanish,former-student,94,94
Carolina,Bongiorno,carovbongiorno@gmail.com,,Languages: Spanish,alumni,93,93
Oksana A,Brice,candy777brice@gmail.com,,Languages: Ukrainian/Russian,alumni,93,93
Amairany,Carreon,amairany_c93@hotmail.com,,Languages: Spanish,alumni,93,93
German,Castillo,gjcastillo@sbcglobal.net,,Languages: Spanish,alumni,93,93
Francis,De La Cruz,dalycruzstudent@gmail.com,,Languages: Spanish,former-student,93,93
Lisa Tram,Doan,tramdoan3@comcast.net,,Languages: Vietnamese,former-student,93,93
Parichher,Forouzan,plove95@gmail.com,,Languages: Farsi,former-student,93,93
Patricia,Garcia,patty07garcia@gmail.com,,Languages: Spanish,alumni,93,93
Luisa,Gonzalez,gonzalezlili23@yahoo.com,,Languages: Spanish,alumni,93,93
Akiko,Ho,akikonh@mail.com,,Languages: Japanese,alumni,93,93
Svetlana,Ivanova,sv.karavaeva@gmail.com,,Languages: Russian,alumni,93,93
Odilienne,Jasmin,odiliennej@gmail.com,,"Languages: French, Creole",former-student,93,93
Yun,Nemoy,yun.nemoy@icloud.com,,Languages: Mandarin,former-student,93,93
Ngoc,Nguyen,ntnguye04@gmail.com,,Languages: Vietnamese,alumni,93,93
Adrean,Placeres,adreanpl@icloud.com,,Languages: Spanish,former-student,93,93
Maryam R.,Rezai,maryamremind@gmail.com,,Languages: Farsi,alumni,93,93
Warsame,Roble,warsameroble2@gmail.com,,Languages: Somali,alumni,93,93
Maria,Ruiz,denruiz28@gmail.com,,Languages: Spanish,alumni,93,93
Elizabeth,Salazar,elizabethsierrasalazar@gmail.com,,Languages: Spanish,alumni,93,93
Yvonne,Salinas,gandaev3@aol.com,,Languages: Spanish,former-student,93,93
Cristian,Santos Santos,cristianxsantosxsantos@gmail.com,,Languages: Spanish,alumni,93,93
Evelyn,Vega,just.evelyn1110@gmail.com,,Languages: Spanish,alumni,93,93
Arisbet,Villanueva Lopez,arislopez13@icloud.com,,Languages: Spanish,former-student,93,93
Lizeth,Aguilera,lizeagui123@gmail.com,,Languages: Spanish,alumni,92,92
Yulieth,Alban,julietalban@hotmail.com,,Languages: Spanish,former-student,92,92
Mays,Alshaikhsalama,mays.salama@outlook.com,,"Languages: English, Arabic",former-student,92,92
Senayt,Andemeskel,senaytann@gmail.com,,Languages: Tigriyna,alumni,92,92
Gladys,Ballesteros,gladysbgld@aol.com,,Languages: Spanish,former-student,92,92
Isadora,Barros,americanoizzie@gmail.com,,Languages: Portuguese,alumni,92,92
Dalyn,Bencosme,dalyn007@gmail.com,,Languages: Spanish,former-student,92,92
Yanira,Benitez,yanirab722@gmail.com,,Languages: Spanish,alumni,92,92
May,gerges,maygergesa@gmail.com,,Languages: Arabic,alumni,92,92
Rita,Goldenberg,1rgold7@gmail.com,,Languages: Russian,alumni,92,92
Andrea,Gutierrez,candy.gf3@gmail.com,,Languages: Spanish,alumni,92,92
Thi,Ha,tiffanyle2809@gmail.com,,Languages: Vietnamese,alumni,92,92
Carolina E,Hernandez,daybrami@yahoo.com,,Languages: Spanish,alumni,92,92
Emerie,Hua,emeriehua@gmail.com,,Languages: Vietnamese,alumni,92,92
Sahar,Ibrahim,saharatif.uok@gmail.com,,Languages: Arabic,alumni,92,92
Anastasiya,Lesyuk,anastasialesyuk@yahoo.com,,Languages: Ukrainian,former-student,92,92
Tram,Luu,tramluu70@yahoo.com,,Languages: Vietnamese,former-student,92,92
Heismer,Minaya,heismer25@gmail.com,,Languages: Spanish,former-student,92,92
Diana,Miranda-Roman,dmira008@ucr.edu,,Languages: Spanish,alumni,92,92
Raquel,Nolasco Fuentes,raquelnolascof19@gmail.com,,Languages: Spanish,alumni,92,92
Jorge,Perez Rodriguez,jorgeperezrodriguez40@gmail.com,,Languages: Spanish,former-student,92,92
Doris,Reyes,dorisitar@gmail.com,,Languages: Spanish,alumni,92,92
Jorge,Salazar,quiequate@gmail.com,,Languages: Spanish,alumni,92,92
Yancy,Sanchez,yancysanchez747@gmail.com,,Languages: Spanish,alumni,92,92
Rocío,Urquia Santana,rociourquiasantana@gmail.com,,Languages: Spanish,alumni,92,92
Tihunbelay,Wolde,tihunbelay.w.ayano@gmail.com,,Languages: Amharic,alumni,92,92
Mariana,Zimler,marianazimler@gmail.com,,Languages: Spanish,alumni,92,92
Ertha,Andre,bdamoumoune@gmail.com,,"Languages: Haitian Creole, and French",alumni,91,91
Quetzaly,Arellano,quetzalyarellano@yahoo.com,,Languages: Spanish,former-student,91,91
Ana,Arizmendi,avmarizmendi@gmail.com,,Languages: Spanish,alumni,91,91
Omarah,Casas,omarahcasas@gmail.com,,Languages: Spanish,alumni,91,91
Zuleica,Castillo,zuleicastillo22@gmail.com,,Languages: Spanish,alumni,91,91
Dalia,De Jesus,dalia6472@gmail.com,,Languages: Spanish,alumni,91,91
Tabitha,Dimas Barrientos,tabithabarrientos1990@gmail.com,,Languages: Spanish,alumni,91,91
Tehreem,Fatima,syedft72@gmail.com,,Languages: Urdu,alumni,91,91
Paula,Favaretto,ailtonbia06@gmail.com,,Languages: Portuguese,former-student,91,91
Lilia,Gonzalez,lilia_gc@hotmail.com,,Languages: Spanish,alumni,91,91
Yesica,Hernandez,yhrndz77@gmail.com,,Languages: Spanish,alumni,91,91
Sifa,Kakonge,sifakakonge20@gmail.com,,"Languages: Swahili, and taabwa",former-student,91,91
Xochitl,Longstaff,xochitl.longstaff@gmail.com,,Languages: Spanish,alumni,91,91
Joanna,McLaughlin,smaangel@hotmail.com,,Languages: Polish,alumni,91,91
Yahina,Mena,ygm25@hotmail.com,,Languages: Spanish,former-student,91,91
Andrea,Olsen,deinhausbr@gmail.com,,Languages: Portuguese,alumni,91,91
Valeria,Quintero,valeria.quintero762@gmail.com,,Languages: Spanish,alumni,91,91
Claudia,Ramirez,claudiaramirez253@gmail.com,,Languages: Spanish,former-student,91,91
Sandra,Russell,sralcan@aol.com,,,alumni,91,91
Stanley,Sanchez,stanleysanchez77@gmail.com,,Languages: Spanish,alumni,91,91
Laura,Serra,laura@lauraserraestudio.com.ar,,Languages: Spanish,former-student,91,91
Ferzana,Suleman,ferzanaasuleman@gmail.com,,Languages: Urdu,alumni,91,91
Kevin,Tobar,kev.tobar@gmail.com,,Languages: Spanish,alumni,91,91
Kathering Ariana,Torres Blanco,ariana_blancog@hotmail.com,,Languages: Spanish,alumni,91,91
Samara,Torrez,samaratworks24@gmail.com,,Languages: Spanish,alumni,91,91
Marie,William Seance,williamnadegerosie@gmail.com,,Languages: Creole haitian and French,alumni,91,91
Jian Lan,Ye,janart1889@gmail.com,,Languages: Cantonese,former-student,91,91
Sandra,Baker,spinkb7@yahoo.com,,,former-student,90,90
Jackson,Brice,polo3335@hotmail.com,,Languages: Haitian creole and french,former-student,90,90
Kimberly,Camacho,camachok7799@gmail.com,,Languages: Spanish,alumni,90,90
Maria,Caviel,mchg22@hotmail.com,,,alumni,90,90
Kelvin,Chanaba,kelvinchanaba@gmail.com,,Languages: Spanish,alumni,90,90
Walter,Cifuentes,zeuswlly@msn.com,,Languages: Spanish,former-student,90,90
Carson,Convery,conver153@gmail.com,,Languages: Spanish,alumni,90,90
Daniela,Falcon,falcondaniiela@gmail.com,,Languages: Spanish,former-student,90,90
Meybelin,Flores,fmeybelin@yahoo.com,,Languages: Spanish,alumni,90,90
Alexandra,Graziano,shanamv219@gmail.com,,Languages: Spanish,former-student,90,90
Michell,Islas,michellislas55@gmail.com,,Languages: Spanish,alumni,90,90
Jinan,Ismael,isljinan@gmail.com,,Languages: Arabic,alumni,90,90
Marina,Komarova,markom111378@gmail.com,,Languages: Russian,alumni,90,90
Mariela,Lobato,lobatomariela1@gmail.com,,Languages: Spanish,former-student,90,90
Yuliana,Magana,ymagana021@gmail.com,,Languages: Spanish,alumni,90,90
Tran,Nguyen,transerena3@gmail.com,,Languages: Vietnamese,alumni,90,90
Yeymi,Orellana,yeymi_orellana@yahoo.com,,Languages: Spanish,alumni,90,90
Blanca,Ovando,quinonez78@yahoo.com,,Languages: Spanish,former-student,90,90
Denise,Perez,deniseperez9_02@yahoo.com,,Languages: Spanish,former-student,90,90
Santiago,Ramos,sramos93@yahoo.com,,Languages: Spanish,former-student,90,90
Carlos,Rivera-Ortiz,gible0122@gmail.com,,Languages: Spanish,alumni,90,90
Jorge,Salazar,jorgesalazar48@gmail.com,,Languages: Spanish,alumni,90,90
Yafreisy,Salazar Ventura,salazarysolutions@gmail.com,,Languages: Spanish,alumni,90,90
Marisol,Villasenor,marisvillasenor@gmail.com,,,alumni,90,90
Mei,Wong,meiwongus@yahoo.com,,Languages: Cantonese,alumni,90,90
Maryamo,Adan,maryam.adan@icloud.com,,Languages: Somali,former-student,89,89
Marcos,Apodaca,apobros@att.net,,Languages: Spanish,alumni,89,89
Wendy E,Becker,wendysbecker07@gmail.com,,Languages: Spanish,alumni,89,89
Xeniya,Belyakova,belyakovaxeniya@gmail.com,,Languages: Russian,alumni,89,89
Araceli,Brown,virgo69sb@yahoo.com,,Languages: Spanish,former-student,89,89
Maria,Camacho,mariapazuniversita@gmail.com,,Languages: Spanish,alumni,89,89
Natalya,Chernykh,chernataly0925@gmail.com,,Languages: Russian,alumni,89,89
Jesus,Colon,jalbertocolonr@gmail.com,,Languages: Spanish,alumni,89,89
Anh,Do,tunes-giggly.0j@icloud.com,,Languages: Vietnamese,former-student,89,89
Yana,Dubasiuk,yana.dubasiuk@gmail.com,,Languages: Ukrainian,alumni,89,89
Jesse,Edgerton,jessege119@gmail.com,,Languages: Spanish,alumni,89,89
Melannie,Elias,mbernal0511@gmail.com,,Languages: Spanish,alumni,89,89
Yalitza,Felix,felixyalitza@yahoo.com,,Languages: Spanish,alumni,89,89
Juliana,Franca,julianafranca21@gmail.com,,Languages: Portuguese,alumni,89,89
Mayra,Hernandez,hdez.vaz7@gmail.com,,Languages: Spanish,alumni,89,89
Elsie,Jason,elsiejade917@gmail.com,,Languages: Mandarin,alumni,89,89
Patti,Leung,leungpatti@gmail.com,,Languages: Cantonese,alumni,89,89
Jessica,Mendoza,julietavioleta0918@gmail.com,,Languages: Spanish,alumni,89,89
Jose,Mengoa,oscarmengoa1@gmail.com,,Languages: Spanish,former-student,89,89
Hanna,Negash,hanna_b_2003@yahoo.com,,Languages: Amharic,former-student,89,89
Minhchau,Nguyen,laurahoang@hotmail.com,,Languages: Vietnamese,former-student,89,89
Kate,Ogaz Munoz,kateogaz@outlook.com,,,alumni,89,89
Perla,Ortega,portega2004@gmail.com,,Languages: Spanish,former-student,89,89
Fartun,Osman,fartunosman1995@gmail.com,,Languages: Somali,alumni,89,89
Diana,Reyes,reyesdiana0207@gmail.com,,Languages: Spanish,alumni,89,89
Tennessee,Salcedo Hernandez,tennessees12@yahoo.com,,Languages: Spanish,former-student,89,89
Jesmary,Santos,jeynbie@gmail.com,,Languages: Spanish,alumni,89,89
Helin,Shamoon,helin_shamoon@yahoo.com,,Languages: Assyrian and Arabic,former-student,89,89
Nimrah,Suleman,nimrahsuleman@gmail.com,,Languages: Pashto and Urdu,alumni,89,89
Roque Elmer,Tacata,roque.elmer_tacata@yahoo.com,,Languages: Tagalog,former-student,89,89
Yunke,Yang,yunke0808@gmail.com,,Languages: Chinese,alumni,89,89
Nacira,Abaiche,abaiche.nacira@gmail.com,,"Languages: Arabe,franch,berber",former-student,88,88
Lorenzo,Batista,mclorensmusic@gmail.com,,"Languages: Spanish,Haitian creol and French",alumni,88,88
Wanda,Bustamante,wandalucia0704@gmail.com,,Languages: Spanish,alumni,88,88
Fabiola,Dareus,fadneydar@gmail.com,,Languages: Haitian Creole,alumni,88,88
David,Epstein,thedaybeforeyoudie@yahoo.com,,Languages: Spanish,alumni,88,88
Zoila,Garcia,zoilagarcia774@gmail.com,,Languages: Spanish,alumni,88,88
Keyla,Garcia,keyla.yari1@gmail.com,,Languages: Spanish,alumni,88,88
Kristina Hudzinski,Gatchell,tina.hudzinski@gmail.com,,Languages: American Sign Language,alumni,88,88
Rahela,Giurculete,rahela_lete@yahoo.com,,Languages: Romanian,former-student,88,88
Rim,Hacheem,reem.hashem9@hotmail.com,,Languages: Arabic & Spanish,alumni,88,88
Elen,Hernandez,elenhernandez8085@yahoo.com,,Languages: Spanish,former-student,88,88
Chanthea,Horn,horn60b@gmail.com,,"Languages: Khmer, thai and German",former-student,88,88
Mansoor,Hussen,hussenmansour078@gmail.com,,Languages: Arabic,former-student,88,88
Edith,Lopez,edithlohe91@gmail.com,,,former-student,88,88
Onesima,Manga,alicenoellie@gmail.com,,Languages: French,alumni,88,88
Isabel,Martinez,dilnatmem@gmail.com,,Languages: Spanish,alumni,88,88
Ismael,Mejia Thomas,mumamejia444@gmail.com,,Languages: Spanish,former-student,88,88
Adriana,Mendoza,agm2125@yahoo.com,,Languages: Spanish,alumni,88,88
Moahmmad,Mohammadi,mohammadim6m@gmail.com,,Languages: Dari/Farsi/Pashto,former-student,88,88
Abida,Muna,abidabd78@gmail.com,,Languages: Bangali,former-student,88,88
Karina,Ortiz,karina_ortiz1@brown.edu,,Languages: Spanish,alumni,88,88
Arooba,Shahbaz,aroobashahbaz999@gmail.com,,Languages: Urdu & Panjabi,former-student,88,88
Kristal,Soto-Lopez,kmariesoto3@gmail.com,,Languages: Spanish,former-student,88,88
Alondra,Temores,alondra.temores6566@gmail.com,,Languages: Spanish,alumni,88,88
Marisol,Torres Ortiz,ariast2011@gmail.com,,Languages: Spanish,former-student,88,88
Hanna,Ziemski,khersongirl@hotmail.com,,Languages: Russian,alumni,88,88
Usman,Akbar,akbarusman616@gmail.com,,"Languages: Urdu,Pashto.",alumni,87,87
Bryant,Aracena,baracena01@hotmail.com,,Languages: Portuguese,former-student,87,87
Dulce,Aragon,dulce14@comcast.net,,Languages: Spanish,former-student,87,87
Keren,Ba Mendoza,keren_ba@hotmail.com,,Languages: Spanish,alumni,87,87
Dylan,Biasatti,dbiasatti1299@gmail.com,,Languages: Spanish,alumni,87,87
Cesar,Campos,cesargcampos@hotmail.com,,Languages: Tagalog,alumni,87,87
Ernesto,Chacin,ernesto_chacin@hotmail.com,,Languages: Spanish,former-student,87,87
Yahel,Corrales,yahecorrales@gmail.com,,Languages: Spanish,alumni,87,87
Gisela,Curi,gisecuri7@icloud.com,,Languages: Spanish,alumni,87,87
Edna,Debarros,ednacv19@hotmail.com,,,alumni,87,87
Anderson,Estivene,andersonestivene3@gmail.com,,Languages: Haitian Creole,alumni,87,87
Aranza,Frutos,aranzafrutos@gmail.com,,Languages: Spanish,alumni,87,87
Michael,Greenberg,mig4013@med.cornell.edu,,Languages: Russian,former-student,87,87
Javier,Hernandez,jav2080her@gmail.com,,Languages: Spanish,alumni,87,87
Amanda,Inocencio,inocencioamanda@gmail.com,,Languages: Spanish and portuguese,alumni,87,87
Mang,Kung,mawngkawi2018@gmail.com,,"Languages: Burmese, Matu Chin, Hakha Chin and Mizo Chin",former-student,87,87
Laura,Martinez,lauramartinezangel@hotmail.com,,Languages: Spanish,alumni,87,87
Brenda,Maturino,bmaturino02@gmail.com,,Languages: Spanish,alumni,87,87
Sophie,Nguyen,lpham.business@gmail.com,,Languages: Vietnamese,alumni,87,87
Nicolas,Ordonez,nicolas6356@gmail.com,,Languages: Spanish,alumni,87,87
Namita,Pandey,pandey.namita@gmail.com,,Languages: Hindi,alumni,87,87
Jamie,Reed,reed3801@yahoo.com,,Languages: Spanish,alumni,87,87
Rafael,Rodriguez,rodriguezraphael25@gmail.com,,Languages: Spanish,alumni,87,87
Evelio E.,Roque-Cervantes,eveliorc@yahoo.com,,Languages: Spanish,former-student,87,87
Aranza,Salinas,aranzasalinas205@gmail.com,,Languages: Spanish,alumni,87,87
Rut,Sanchez,amadai81400@gmail.com,,Languages: Spanish,alumni,87,87
Alyssa,Selmer,alyssaselmer1977@gmail.com,,,alumni,87,87
Abha,Srivastava,abhamicro@gmail.com,,Languages: Hindi,alumni,87,87
Tam,Truong,nhitam2611@gmail.com,,Languages: Vietnamese,alumni,87,87
Tania,White,ambnaom93@gmail.com,,Languages: Spanish,alumni,87,87
Enas,Alomari,enas18@gmail.com,,Languages: Arabic,alumni,86,86
Olivia,Call,olivia.call96@gmail.com,,Languages: Spanish,alumni,86,86
Anndy,Davilma,dr.davilma@gmail.com,,"Languages: Spanish,French, Creole",alumni,86,86
Jhadai,Domingo,jhadaisunday@hotmail.com,,Languages: Spanish,former-student,86,86
Sandra,Dunston,dunstonsan@gmail.com,,Languages: Spanish,alumni,86,86
Jean Emmanuel,Fouche,jeanfouch@yahoo.fr,,"Languages: Spanish , Haitian Creole, French",former-student,86,86
Cristina,Garcia,cristina1103@me.com,,Languages: Spanish,former-student,86,86
Gaby,Herrera,gabyescobarlopez11@gmail.com,,Languages: Spanish,former-student,86,86
Erzana,Kiqina,kiqinaerzana@gmail.com,,Languages: Albanian and turkish,former-student,86,86
Mondesir R,Lamy,mondesirr1lamy@gmail.com,,Languages: Haitian Creole and French,former-student,86,86
Atalia,Lopez,annyatalia@hotmail.com,,Languages: Spanish,former-student,86,86
Robert Lee,Loredo,7loredo7@gmail.com,,Languages: ASL,former-student,86,86
Lorena,Medrano,medranol@mcpherson.edu,,Languages: Spanish,former-student,86,86
Fabiana,Paolini,fabiipaolini@gmail.com,,Languages: Spanish,former-student,86,86
Schnyder,Petit-compere,schnyderp159@gmail.com,,Languages: Hatien Creole,former-student,86,86
Nelia,Rodriguez,rodriguez.nelia@yahoo.com,,Languages: Spanish,former-student,86,86
Edwin,Rodriguez Rojas,theboyone3@gmail.com,,Languages: Spanish,alumni,86,86
Jhoswell,Rosario,jhoswell.rosario@gmail.com,,Languages: Spanish,alumni,86,86
Patricia,Silva,patychris73@gmail.com,,Languages: Portuguese,alumni,86,86
Landry,Tchami Axel,tchamson@yahoo.com,,Languages: French,former-student,86,86
Christian,Valencia,christian.valencia28@gmail.com,,Languages: Spanish,alumni,86,86
Abdiel,Vital,abdielvital24@gmail.com,,Languages: French and Haitian Creole,former-student,86,86
Hector,Zamora,hectoruliseszamora@hotmail.com,,Languages: Spanish,former-student,86,86
Jeanette,Alcantara,a.jeanette00@yahoo.com,,Languages: Spanish,former-student,85,85
Myriam M,Basquin,mmikael.basquin@gmail.com,,Languages: Creole,former-student,85,85
Nancy,Bonilla,nebonilla96@gmail.com,,Languages: Spanish,former-student,85,85
Cristal,Cervantes,cristalcervantess94@gmail.com,,Languages: Spanish,alumni,85,85
Pierre,Charles,charlespierre455@yahoo.com,,Languages: French and Haitian Creole,former-student,85,85
Joana,Flores Lopez,joana.cerritos07@gmail.com,,Languages: Spanish,alumni,85,85
Yair,Garcia Sanavia,garciayair13@gmail.com,,Languages: Spanish,former-student,85,85
Mariana,González Pardo,uaynana@gmail.com,,Languages: Spanish,alumni,85,85
Lucia,Hernandez,luciahdz1228@gmail.com,,Languages: Spanish,former-student,85,85
Jacob,Jones,jacob.jones615@gmail.com,,Languages: Japanese,alumni,85,85
Han,Kong,hkong2009.hk@gmail.com,,Languages: Mandarin,alumni,85,85
Sonia,Lopez,solocami02@gmail.com,,Languages: Spanish,former-student,85,85
Damaris,Martinez,dmartinez06789@gmail.com,,Languages: Spanish,alumni,85,85
Alben Varesh,Mbon Obvie,vareshmbonobvie@gmail.com,,Languages: French,former-student,85,85
Mai,Ngo,mayngo112@gmail.com,,Languages: Cantonese,alumni,85,85
Anani,Rios-Parada,riosanani@gmail.com,,Languages: Spanish,alumni,85,85
Jessica,Rivera,rivera.jessica22.2@gmail.com,,Languages: Spanish,alumni,85,85
Jackelin,Santander Herrera,jackysantander@hotmail.com,,Languages: Spanish,former-student,85,85
Alexsa,Severino,alexsa0215@gmail.com,,Languages: Spanish,alumni,85,85
Paulina,Spencer,paulinatsr@gmail.com,,Languages: Spanish,alumni,85,85
Ferzana,Suleman,ferzana_suleman@yahoo.com,,Languages: Urdu,former-student,85,85
Cindy,Urzua,cindyu13@gmail.com,,Languages: Spanish,alumni,85,85
Asadollah,Afshar,ace.afshar@gmail.com,,Languages: Farsi,alumni,84,84
Amber,Biswa,biswa.amber16@gmail.com,,Languages: Nepali,alumni,84,84
Marc Henry,Eugene,marchenryeugene@gmail.com,,"Languages: Spanish, French and Creole",alumni,84,84
Teresa,Flores,teresa_flores2@live.com,,Languages: Spanish,alumni,84,84
Liliana,Gutierrez,lilianagutierrez0824@gmail.com,,Languages: Spanish,former-student,84,84
Miyuki,Hansen,miyukihansen@gmail.com,,Languages: Japanese,former-student,84,84
Tania,Ledezma,ledezma_tania@yahoo.com,,Languages: Spanish,alumni,84,84
Kathrine,Mares,ktmmares@gmail.com,,Languages: Spanish,alumni,84,84
Nisreen,Mashayekh,nisreen@kw.com,,Languages: Arabic,former-student,84,84
Parker,McMillan,parkermcmillann@gmail.com,,Languages: Spanish,alumni,84,84
Hailey,Pena,pena.hailey@gmail.com,,Languages: Spanish,former-student,84,84
Tyrone,Perdomo,tyroneperdomo@synoil-chem.com,,Languages: Spanish,former-student,84,84
Francisco,Plascencia ayala,franciscoplascenciaa@yahoo.com,,Languages: Spanish,former-student,84,84
Juan,Rivera,franciscoriveradesign@gmail.com,,Languages: Spanish,former-student,84,84
Mohammad,Shahidani,moh.hadi2003@gmail.com,,Languages: Dari/Farsi,alumni,84,84
Katia,Aguiar,kkamosso@icloud.com,,Languages: Portuguese,former-student,83,83
Saba,Alsamhouri,sabasamhouri@gmail.com,,Languages: Arabic,alumni,83,83
Angela,Bonilla,angelambonillas@gmail.com,,Languages: Spanish,alumni,83,83
Aisha,Cayetano,g.sellecayetano@yahoo.com,,Languages: Spanish,former-student,83,83
Joanne,Cheristin,cheristinj@yahoo.com,,Languages: Haitian Creole,alumni,83,83
Abigail,Cruz Castillo,abigailbuffone18@hotmail.com,,Languages: Spanish,former-student,83,83
Natalia Sofia,De la Mora López,sofia.delamora.egs@gmail.com,,Languages: Spanish,alumni,83,83
Soulei HannahSunrise,Dicker,hannasun@hawaii.edu,,Languages: Spanish,former-student,83,83
Luz,Garcia,luzr85@yahoo.com,,Languages: Spanish,former-student,83,83
Saredo,Goumaneh,saredogo@gmail.com,,Languages: Somali,alumni,83,83
Araceli,Martinez,aracelimartinez66226@gmail.com,,Languages: Spanish,alumni,83,83
Mariely,Morales,soymorales01@gmail.com,,Languages: Spanish,alumni,83,83
Josefina,Olivas,jojoolivasfitness123@gmail.com,,Languages: Spanish,alumni,83,83
Ana,Perez,analuna2224@icloud.com,,Languages: Spanish,alumni,83,83
Jozelene,Queiroz,jozqz.d@gmail.com,,Languages: Português and Spanish,alumni,83,83
Najeebullah,Raihan,engnajeeb_shaheed@yahoo.com,,Languages: Pashto,alumni,83,83
Edith,Rojas,edithrojasr85@gmail.com,,Languages: Spanish,alumni,83,83
Nepes,Valiyev,nepes.v@gmail.com,,Languages: Russian,alumni,83,83
Elena,Velasquez Hernandez,velasquez.elena.evh@gmail.com,,Languages: Spanish,alumni,83,83
Yidan,Zhang,constantiazhang@gmail.com,,Languages: Mandarin,alumni,83,83
Eliacim,Aguilera,eliacimaguilera7@gmail.com,,Languages: Spanish,alumni,82,82
Pinar,Akca,nehirask@icloud.com,,Languages: Turkish,former-student,82,82
Ronita,Ashourmaram,r.ashourmaram@gmail.com,,"Languages: Assyrian, Persian, and Turkish",alumni,82,82
Lyan,Basora Dorville,lyan.basora@gmail.com,,Languages: Spanish,alumni,82,82
Maria,Beneventi,maria.beneventi@icloud.com,,Languages: Russian,alumni,82,82
Vinicius,Beresnitzky,vinixius@gmail.com,,Languages: Portuguese,alumni,82,82
Carmen,Casas,carmenrcasas@gmail.com,,Languages: Spanish,alumni,82,82
Juan,Chavez Chavez,juanrchavez096@gmail.com,,Languages: Spanish,alumni,82,82
Khadim,Diop,khadim.diop347@gmail.com,,Languages: Wolof,alumni,82,82
Rosely,Flores,analyflores.af@gmail.com,,Languages: Spanish,alumni,82,82
Hachemy,Gabriel,gabrielhachemy@yahoo.fr,,Languages: Haitian Creole,former-student,82,82
Elizabeth,Garcia,erivas334@gmail.com,,Languages: Spanish,former-student,82,82
Santiago,Hernández,emiliodesiga@gmail.com,,Languages: Spanish,alumni,82,82
Johnson,Joachim,johnsonjoachim43@gmail.com,,"Languages: Haitian Creole, French",alumni,82,82
Alexis,Kalitanyi,alexiskalitanyi16@gmail.com,,Languages: KINYARWANDA,former-student,82,82
Tetenyo,Kodah,tetenyokodah@gmail.com,,Languages: French,former-student,82,82
Giovanni,La Terra,giovannilaterra@hotmail.com,,Languages: Italian,alumni,82,82
Damaris,López -Sánchez,damadamita07@gmail.com,,Languages: Spanish,alumni,82,82
Leyla,Maharramova,leyla@maharramova.com,,Languages: Russian,former-student,82,82
Magda,Makarucha,antypolki@gmail.com,,Languages: Polish,alumni,82,82
Catalina,Medina Cortez,maple3cat@gmail.com,,Languages: Spanish,alumni,82,82
Helen,Nebi,helennebi5@gmail.com,,Languages: Amharic and Tigregna,former-student,82,82
Emelyn,Pobuda,emelyn9@gmail.com,,Languages: Filipino,alumni,82,82
Rosanna,Recalde,rr4319555@hotmail.com,,Languages: Spanish,former-student,82,82
Raul,Sanabria,raulsplash2@gmail.com,,Languages: Spanish,former-student,82,82
Molly,Sheridan,aslmolly@yahoo.com,,Languages: Spanish,former-student,82,82
Natalia,Solz,natalia.mmasnica@gmail.com,,Languages: Polish,alumni,82,82
Tamara,Tattersall,tammcst83@gmail.com,,Languages: Spanish,alumni,82,82
Paulina,Wlodzimirow,okasa3006@yahoo.com,,Languages: Polish,former-student,82,82
Juan Sebastian,Zea Gil,juanszeagil@gmail.com,,Languages: Spanish,alumni,82,82
Natalia,Zelaya,natzelaya@gmail.com,,Languages: Spanish,former-student,82,82
Jacques Stephen,Benjamin,jbenjamin2626@gmail.com,,Languages: English Haitian Creole,former-student,81,81
Florane,Charles,florha85@gmail.com,,Languages: Haitian Creole/French,alumni,81,81
Kaycie,Christen,kayciechristen@gmail.com,,Languages: Spanish,former-student,81,81
Monel,Cine,cinemonel76@gmail.com,,Languages: Haitian Creole,alumni,81,81
Guadalupe Nataly,Cuevas Flores,gnataly1225@gmail.com,,Languages: Spanish,alumni,81,81
Keila,DeOliveira,keilasaliture@gmail.com,,Languages: Portuguese,alumni,81,81
Karen,Escobar,kayesco1091@gmail.com,,Languages: Spanish,alumni,81,81
Jessica,Hasbun,jks.moreno@gmail.com,,Languages: Spanish,alumni,81,81
Bao,Hoang,bo.bo2308@yahoo.com,,Languages: vietnamese,alumni,81,81
Sandra,Holtz,sandraconrado@yahoo.com.br,,Languages: Portuguese,former-student,81,81
Baiyu (Barbara),Huang,baiyusan@gmail.com,,Languages: Mandarin,alumni,81,81
Clara,Lamas,lamas.clara.e@gmail.com,,Languages: Spanish,alumni,81,81
Maria Christina,Lanuza Rode,christina.lanuza@gmail.com,,Languages: Spanish,alumni,81,81
Declan,Merbeth,demerbeth@gmail.com,,Languages: Spanish,alumni,81,81
Miusel,Montano,montano.miusel@gmail.com,,Languages: Spanish,alumni,81,81
Cesiah,Moreno,cesiah777@gmail.com,,Languages: Spanish,former-student,81,81
Paulo,Ngongo,paulongongo@yahoo.com,,Languages: Portuguese,former-student,81,81
Ashly,Paz,ruthylandia@yahoo.com,,Languages: Spanish,former-student,81,81
Tyler,Pham,tylertpham.bos@gmail.com,,Languages: Vietnamese,former-student,81,81
Tatyana,Plokhov,tatyanaplokhov@gmail.com,,Languages: Russian,alumni,81,81
Jacqueline,Reyes,tootsiej29@hotmail.com,,Languages: Spanish,former-student,81,81
Julia,Rocha,julia_m63@ymail.com,,Languages: Portuguese,alumni,81,81
Dollys,Sanchez,dollyssanc@gmail.com,,Languages: Spanish,alumni,81,81
Nusrat,Sharmin,ireenmia25@gmail.com,,Languages: Bengali,alumni,81,81
Sandra,Torres,sandftorres@yahoo.com,,Languages: Spanish,former-student,81,81
Olga,Tsyfanski,olga.v.govorun@gmail.com,,Languages: Ukrainian,alumni,81,81
Yesica,Velez,yesica.velez@glfhc.org,,Languages: Spanish,former-student,81,81
Juleeann,Vicente,juleeann20@gmail.com,,Languages: Spanish,alumni,81,81
Ham,Zar,zarh0828@gmail.com,,Languages: Burmese,former-student,81,81
Patricia,Zarate,pzarate196868@gmail.com,,Languages: Spanish,alumni,81,81
Tatyana,Arceneaux,tatiyana.gladkaya@gmail.com,,"Languages: Russian, Ukrainian",alumni,79,79
Kerlly,Armas,kerllymanzany13@gmail.com,,Languages: Spanish,alumni,79,79
Ashley,Canales,ashleycanales96@gmail.com,,Languages: Spanish,alumni,79,79
Yader,Carcamo,bismarkcarcamo22@gmail.com,,,alumni,79,79
Alejandro,Castillo,alejandrosoccer25@gmail.com,,Languages: Spanish,alumni,79,79
Lovepreet,Cheema,cheemal1011@gmail.com,,"Languages: Hindi, Punjabi",alumni,79,79
Dyna,Cherubin,dcherubin124@gmail.com,,Languages: Haitian Creole,alumni,79,79
Jennifer,Couret,jennifercouret@hotmail.com,,Languages: Spanish,alumni,79,79
Erickson,Cyrius,cyriuserickson@yahoo.com,,Languages: Spanish / Haitian Creole,alumni,79,79
Elizabeth,Davis,chabela7765@gmail.com,,Languages: Spanish,alumni,79,79
Marlene,De La Rosa,delarosaochoamar@gmail.com,,Languages: Spanish,former-student,79,79
Soledad,Gallegos,gallegossoledad7@gmail.com,,Languages: Spanish,alumni,79,79
Adrian,Garcia,adriangarciavaldes@hotmail.com,,Languages: Spanish,former-student,79,79
Lourdes,Garcia Aguilar,pecaluo07@gmail.com,,Languages: Spanish,alumni,79,79
Yesenia,Giron,yeseniagironpaz@gmail.com,,Languages: Spanish,alumni,79,79
Dania,Jacubovich,daniushi@gmail.com,,Languages: Spanish,alumni,79,79
Joshua,Jorge,joshuajorgej@gmail.com,,Languages: Spanish,alumni,79,79
Sawsan,Katbie,sawsan.katbey@gmail.com,,Languages: Arabic,alumni,79,79
Shahin,Kazempour Matanagh,shahin.k.matanagh@gmail.com,,Languages: Farsi,alumni,79,79
Arouj,Khaliq,aarooj59@yahoo.com,,Languages: Urdu,former-student,79,79
Jailine,Nunez,jailinenunez08@gmail.com,,Languages: Spanish,alumni,79,79
France,Pomajevich,francious75@yahoo.com,,,former-student,79,79
Eugene,Quinones,eoqg1202@gmail.com,,Languages: Spanish,alumni,79,79
Keily,Rodriguez,rodriguezlunacx@gmail.com,,Languages: Spanish,alumni,79,79
Luz,Rosario,kongteam47@gmail.com,,Languages: Spanish,alumni,79,79
Safir dad,Safi,safirsafi430@gmail.com,,Languages: Pashto,former-student,79,79
Vitalie,Sapteboi,brightstar0917@gmail.com,,Languages: Russian,alumni,79,79
Nswa,Sombo,n.ngabyoma@gmail.com,,"Languages: French, Swahili, Kinyarwanda, Kirundi",alumni,79,79
Elitania,Tellez,taniatellez@yahoo.com,,Languages: Spanish,former-student,79,79
Alejandra,Valenzuela,badbunny_666@icloud.com,,Languages: Spanish,alumni,79,79
Leticia,Alves dos Santos,alvesleticia.santos@hotmail.com,,Languages: Portuguese,alumni,78,78
Darya,Artemova,ldashst@gmail.com,,Languages: Russian,alumni,78,78
Mayra,Belasquez,mayrabelasquez@yahoo.com,,Languages: Spanish,former-student,78,78
Maudio,Cardona,renecardom@gmail.com,,Languages: Spanish,alumni,78,78
Mariana,De Souza,marii.desouza@live.com,,Languages: Portuguese,alumni,78,78
Joaneet,Diaz,desteniejohany@yahoo.com,,Languages: Spanish,alumni,78,78
Tamara,Exil,exiletammy26@gmail.com,,Languages: Creole,former-student,78,78
Mary Katherine,Hartigan,hartigan.m@northeastern.edu,,Languages: Spanish,alumni,78,78
Alla,Irelan,alla.upg@gmail.com,,Languages: Russian,alumni,78,78
Marcelle,Kanan,marcellekanan@gmail.com,,Languages: Portuguese,alumni,78,78
Vian,koma,vianabad@yahoo.com,,Languages: Arabic,alumni,78,78
Tatiane,Lara,tatianelara@myyahoo.com,,Languages: Portuguese,former-student,78,78
Brenda,Lemus,brendalemus440@gmail.com,,Languages: Spanish,alumni,78,78
Siyang,Liu,liuyue4170@163.com,,Languages: Chinese,former-student,78,78
Elizabeth,Perez,elizabeth.708@gmail.com,,Languages: Spanish,alumni,78,78
Mie Philomene,Pierre Paul,lashei63@hotmail.com,,,alumni,78,78
Dulce,Trenado,dulce.trenado@yahoo.com,,Languages: Spanish,alumni,78,78
Haya,Abaherah,vivalarakitic@gmail.com,,Languages: Spanish,alumni,77,77
Madeena,Asar,asarmadina@gmail.com,,Languages: Pashto,alumni,77,77
Araceli,DeLeon-Mendez,araceli.deleon.mendez@gmail.com,,Languages: Spanish,alumni,77,77
Mario,Eyzaguirre,marioeyz@gmail.com,,Languages: Spanish,alumni,77,77
Jennifer,Garcia,garciajennifer0327@icloud.com,,Languages: Spanish,former-student,77,77
Ana,Gayosso,anagayosso1254@gmail.com,,Languages: Spanish,alumni,77,77
Buthaina,Ghneim,buthainag78@gmail.com,,Languages: Arabic,alumni,77,77
Mayra,Gomez,mgallegos2392@icloud.com,,Languages: Spanish,former-student,77,77
Alla,Kovch,allakovch@gmail.com,,Languages: Ukrainian/Russian,alumni,77,77
Araceli,Leon,viviara2@gmail.com,,Languages: Spanish,alumni,77,77
Myriam,Louis-Jean,tishalouisjean95@gmail.com,,Languages: haitian creole,former-student,77,77
Maria,MacDonald,mariaisabelmacdonald@yahoo.com,,Languages: Spanish,alumni,77,77
Betsy,Maldonado,betsy.maldonado96@gmail.com,,Languages: Spanish,former-student,77,77
Angela,Moreno,mm.angela_1021@yahoo.com,,Languages: Spanish,alumni,77,77
Gabriela,Moreno,gabimoreno@yahoo.com,,Languages: Spanish,alumni,77,77
Crystal,Padilla,lilmisscriss.cp@gmail.com,,Languages: Spanish,former-student,77,77
Manuel A.,Pena F.,mpedk9h@outlook.com,,Languages: Spanish,alumni,77,77
Kimberly,Ramirez,kimberlyy.r16@gmail.com,,Languages: Spanish,alumni,77,77
Tacoyia,Redmon,tacoyiaredmon@gmail.com,,Languages: Spanish,alumni,77,77
Deanna,Riley,riley.deanna714@gmail.com,,Languages: Spanish,alumni,77,77
Brenda,Alvarez,balvarez0512@gmail.com,,Languages: Spanish,alumni,76,76
Tiffany,Baca,tiffanybaca17@gmail.com,,Languages: Spanish,former-student,76,76
Lizbeth,Castro,lizcastro91@yahoo.com,,Languages: Spanish,former-student,76,76
Bilal,Chakas,bilalchakas@yahoo.com,,Languages: Arabic,alumni,76,76
Alejandra,Comunidad Luna,alejandra.comunidad93@gmail.com,,Languages: Spanish,alumni,76,76
Chely,Cruz,chelycruz27@gmail.com,,Languages: Spanish,alumni,76,76
Matthew,Dexter,matthewedexter@gmail.com,,Languages: Spanish,alumni,76,76
Emiliia,Druchuk,edruchuk@gmail.com,,Languages: Ukrainian Russian,alumni,76,76
Ewelina,Ewelina,ewe.mak@gmail.com,,Languages: Polish,alumni,76,76
Elaha,Fazil haq,leema.dost4848@gmail.com,,Languages: Dari,alumni,76,76
Husameldin,Hamad,husamhaj6@gmail.com,,Languages: Arabic,alumni,76,76
Ishkarandeep,Kaur,kaurishdeep93@gmail.com,,,alumni,76,76
Anna,Lopez,anlopez1508014@gmail.com,,Languages: Spanish,alumni,76,76
Joselyn,Miranda Flores,mirandafloresjoselyn002@gmail.com,,Languages: Spanish,former-student,76,76
Nut,Miñano,nut.minanoc@gmail.com,,Languages: Spanish,alumni,76,76
Marie,Perez,marieperez1975@gmail.com,,Languages: Spanish,alumni,76,76
Ishmaaiyl,Perez,kuroryu.6@gmail.com,,"Languages: Spanish, Portuguese and Arabic",alumni,76,76
Katarzyna,Polinska,k.w.polinska@gmail.com,,Languages: Polish,alumni,76,76
Matheus,Ramos,matheusfelipeb42@gmail.com,,Languages: Portuguese,alumni,76,76
Luisa,Romero,luromerog1@gmail.com,,Languages: Spanish,alumni,76,76
Nereida,Segura,nereidasegura14@gmail.com,,Languages: Spanish,alumni,76,76
Thailane,Thailane,tmf380@gmail.com,,Languages: Portuguese,alumni,76,76
Sagar,Thakkar,sagar_thakkar2003@yahoo.com,,Languages: Gujarati,former-student,76,76
Alexandra,Yu,1960ming@gmail.com,,Languages: Mandarin Chinese,alumni,76,76
Mariya,Zhdanova,mariya_zhdanova@bk.ru,,Languages: Russian,former-student,76,76
Buthina,Alrifai,zainalzain0000011111@gmail.com,,Languages: Arabic,alumni,75,75
Lelia,Avalos,lelia_07@icloud.com,,Languages: Spanish,former-student,75,75
Monica,Diez,moniquehinmun@aol.com,,Languages: Spanish,former-student,75,75
Sasha,Elm,elmsasha@gmail.com,,Languages: Uzbek,alumni,75,75
Aracely,Gonzalez,ary_gonzalez730@yahoo.com,,Languages: Spanish,former-student,75,75
Alicia,Hernandez,alysanchez9400@outlook.com,,,former-student,75,75
Marbel,Lewis,marbel5261@yahoo.com,,Languages: Spanish,alumni,75,75
Elijah,Lowe,elilowe27@gmail.com,,Languages: Spanish,alumni,75,75
Rustin,Lowe,rustinlowe@gmail.com,,Languages: Spanish,alumni,75,75
Katherine,Mendoza Ayala,katherineayala0217@yahoo.com,,Languages: Spanish,alumni,75,75
Fransys,Molina,fransysmolina94@gmail.com,,Languages: Spanish,alumni,75,75
Minh,Ngo,ngominhhau89@gmail.com,,Languages: Vietnamese,alumni,75,75
Sarah,Obrien,kjscobrien@gmail.com,,Languages: Mandarin,former-student,75,75
César,Pérez,thecear9797@gmail.com,,Languages: Spanish,former-student,75,75
Angela,Quiñonez,mrs.mrortega@gmail.com,,Languages: Spanish,alumni,75,75
Minelinais,Rodriguez,cristalrodriguez.211898@gmail.com,,Languages: Spanish,former-student,75,75
Nelly,Roman Gullings,aroman@chs-nw.org,,Languages: Spanish,former-student,75,75
Yvette,Romero,yvetteromero09@gmail.com,,Languages: Spanish,former-student,75,75
Johanny,Saldivar,j.saldivar@ymail.com,,Languages: Spanish,former-student,75,75
Maria,Valdez Acosta,mariava121882@gmail.com,,Languages: Spanish,alumni,75,75
Dwardy,Vilmeus,dwardyrv@gmail.com,,Languages: Spanish,alumni,75,75
Donna,Abourass,dabourass@hotmail.com,,Languages: Arabic,alumni,74,74
Yana,Almanzar,almanzar.yana@gmail.com,,Languages: Russian,alumni,74,74
Vasti,Arroyo,vasti.loubett@gmail.com,,Languages: Spanish,alumni,74,74
Neven,Botros,nevenbot@gmail.com,,Languages: Arabic,alumni,74,74
Angel,Cabrera,siboney613@gmail.com,,Languages: Spanish,alumni,74,74
Andrea,Cervantes Garcia,andreabruh123@gmail.com,,Languages: Spanish,alumni,74,74
Yanny,Contreras-Santofimio,yanny2161@gmail.com,,Languages: Spanish,former-student,74,74
Jessica,Curi,jessicaccaldeira@gmail.com,,Languages: Portuguese,alumni,74,74
Andie,Gorowsky,andiegoro5@gmail.com,,Languages: Spanish,alumni,74,74
Daisy,Herrera,daisyherrera4.dh@gmail.com,,Languages: French,former-student,74,74
Johan,Johan,jovawunz@gmail.com,,Languages: Spanish,alumni,74,74
Estephany,Juarez,tefanyjuarez@gmail.com,,Languages: Spanish,former-student,74,74
Eva,Lazo,evamari503@gmail.com,,Languages: Spanish,former-student,74,74
Seth,Mayor,seth.mayor@ulv.edu.mx,,Languages: French,alumni,74,74
Elsa,Mejia,xelsamqx@gmail.com,,Languages: Spanish,former-student,74,74
Zulaineles,Melendez,zulaineles@gmail.com,,Languages: Spanish,alumni,74,74
Joao,Moderno,jrmoderno@gmail.com,,Languages: Portugese,alumni,74,74
Juan,Ocampo,jd.loans@yahoo.com,,Languages: Spanish,former-student,74,74
Suzan,Orahim,suzany06@yahoo.com,,Languages: Assyrian,former-student,74,74
Christina,Perez,cdpemg17@gmail.com,,Languages: Spanish,former-student,74,74
Olga,Rozhkova,kukupika7@gmail.com,,Languages: Russian,alumni,74,74
Rebeca,Sloan,rebecasloan115@gmail.com,,Languages: Spanish,alumni,74,74
Mayra,Smith,mayraileanasmith@gmail.com,,Languages: Spanish,alumni,74,74
Eneline,Souza,eneline23@hotmail.com,,Languages: Portuguese,alumni,74,74
Waheeda,Tariq,waheedatariq@yahoo.com,,"Languages: Dari, Pashto & Urdu",former-student,74,74
Wiolet,Youkhana,wyokhana@gmail.com,,Languages: Assyrian,alumni,74,74
Jade,Alvarez,jadealvarez165@gmail.com,,Languages: Spanish,former-student,73,73
Cindy,Angervil,cindyangervil@gmail.com,,Languages: Haitian Creole,alumni,73,73
Wendy,Becerra Ortiz,wendybo17@gmail.com,,Languages: Spanish,alumni,73,73
Abigail,Boye-Row,aboyerow@gmail.com,,Languages: Twi,alumni,73,73
Yolanda,Cardenas,hr@tiptonmedicalclinic.com,,Languages: Spanish,alumni,73,73
Esmeralda,Claros,clarosesme@gmail.com,,Languages: Spanish,alumni,73,73
Milene,De Brito,zaydendebrito22@icloud.com,,"Languages: Portuguese,Spanish and Cape Verdean Creole",alumni,73,73
Aissatou,Diallo,adiallo792@gmail.com,,"Languages: French, Fulani, Mandinka, Soussou",alumni,73,73
Summya,Fraijat,dr_sumayya@yahoo.com,,Languages: Arabic,former-student,73,73
Gema,Garcia,castilloema299@gmail.com,,Languages: Spanish,alumni,73,73
Manal,Mahdi,mahdimanal934@gmail.com,,Languages: Arabic,alumni,73,73
Anyeris,Marte,macdelaysi0120@gmail.com,,Languages: Spanish,alumni,73,73
Yacoubou,Maryam,maryamyacoubou@gmail.com,,"Languages: French, Hausa",alumni,73,73
Juliana,Muhaj,juliana.muhaj@yahoo.com,,Languages: Albanian,alumni,73,73
Huyen Bao,Ngo,annabaongo@gmail.com,,Languages: russian and vietnamese,alumni,73,73
Tran,Nguyen,ndntran199@gmail.com,,Languages: Vietnamese,alumni,73,73
Aslyn,Ochoa,emelyochoa1040@gmail.com,,Languages: Spanish,former-student,73,73
Samantha,Pena,sammip0427@gmail.com,,Languages: Spanish,former-student,73,73
Jennifer,Perez,jenremember85@gmail.com,,Languages: Spanish,former-student,73,73
Melinda,Perez,perez.melinda@gmail.com,,Languages: Spanish,alumni,73,73
Jetcel,Rodriguez,jetcelrodriguez84@gmail.com,,Languages: Spanish,alumni,73,73
Mohammad Rahman,Shahzad,mohammadrahman823@gmail.com,,"Languages: Pashto, Dari and Urdu",alumni,73,73
Andrejs,Sitiks,sitiks@rmu.edu,,"Languages: Russian , Latvian",alumni,73,73
Carlos,Villegas,antoine.martens17@gmail.com,,Languages: Spanish,alumni,73,73
Pa,Yaw,payaw004@gmail.com,,Languages: Burmese,former-student,73,73
RoxanaSofiaLahore,,roxanasofialahore@gmail.com,,Languages: Pending Payment/Registration,former-student,72,72
Aileen,Arreola,flpdashie@gmail.com,,Languages: Spanish,former-student,72,72
Roberto,Contreras Toledo,roberto.contrerax@gmail.com,,Languages: Spanish,alumni,72,72
Massimo,DiMeo,marcimo1@proton.me,,Languages: Italian,former-student,72,72
AndiRoxana,FloresLahore,andiroxanafloreslahore@gmail.com,,Languages: Spanish & ASL,alumni,72,72
Eric,Frankovsky,erricle9964@gmail.com,,Languages: Vietnamese,alumni,72,72
Paola,Galvan Rodriguez,pgalvan816@gmail.com,,Languages: Spanish,alumni,72,72
Eduardo,Garcia,eduardogh1231@gmail.com,,Languages: Spanish,former-student,72,72
Dolores Yaneth,Gomez,yanethgomez33@gmail.com,,Languages: Spanish,former-student,72,72
Evelyn,Gomez,g.evelyn1992@gmail.com,,Languages: Spanish,former-student,72,72
Joelle,Kemajou Tchami,tjoelleinterpreter@gmail.com,,Languages: French,alumni,72,72
Gladis,Leon,gladisbeza@yahoo.com,,Languages: Spanish,former-student,72,72
Kevin,Li,kevin112300123@gmail.com,,Languages: Mandarin,alumni,72,72
Iryna,Melko,irynamelko@yahoo.com,,"Languages: Polish, Ukrainian, Russian",alumni,72,72
Emabet,Minda,joyfulwithlord@gmail.com,,Languages: Amaharic,alumni,72,72
Kenia,Molina,kenialma14@gmail.com,,Languages: Spanish,alumni,72,72
Maria Fernanda,Mosso,mariam4231@gmail.com,,Languages: Spanish,former-student,72,72
Samantha,Mostajo Zurita,samanthamostajo@gmail.com,,Languages: Spanish,alumni,72,72
Marc,Ndabaramiye,marcndabaramiye@gmail.com,,Languages: Kinyarwanda and Swahili,alumni,72,72
Ellen,Pearce,elena16sorokina@gmail.com,,Languages: Russian,alumni,72,72
Rosangie,Ramirez,rosangieramirez@gmail.com,,Languages: Spanish,former-student,72,72
Brenda,Reyes,breyes2202@gmail.com,,Languages: Spanish,former-student,72,72
Cole,Robinson,doncolerobinson@gmail.com,,Languages: Spanish,alumni,72,72
Victoria,Rojas,whitewings14@hotmail.com,,,alumni,72,72
Sayuri,Sanabria,ss.souslevent@gmail.com,,Languages: Spanish,alumni,72,72
Diana,Shores,shoresdiana18@gmail.com,,Languages: Spanish,alumni,72,72
Entesar,Subeh,razanflower18@gmail.com,,Languages: Arabic,alumni,72,72
Kim Ruth,Vazquez,superkimvazquez@gmail.com,,Languages: Spanish,alumni,72,72
Pedro,Villalobos,pedrovillalobos31989@gmail.com,,Languages: Spanish,former-student,72,72
Jennifer,Beatriz Ruiz,jenniferbf31@icloud.com,,Languages: Spanish,former-student,71,71
Nuria,Borges,borgesnuria@yahoo.com,,Languages: Portuguese,former-student,71,71
Veronica,Botelho,veronyca24@gmail.com,,Languages: Portuguese,alumni,71,71
Emmanuel,Camisson,camissonemmanuel@yahoo.com,,,former-student,71,71
Mikala,Dykstra,mikaladykstra@gmail.com,,Languages: Spanish,alumni,71,71
Yuliana,Dzhus,vasiliydzhus_1@hotmail.com,,Languages: Ukrainian,former-student,71,71
Fredy,Estrada,stradafrd234@gmail.com,,Languages: Spanish,alumni,71,71
Esmeralda G.,Fernandez,pitaf1970@gmail.com,,Languages: Spanish,former-student,71,71
Ileana,Ferrano,iferrano@gmail.com,,Languages: Spanish,alumni,71,71
Lidjna,Frederique,lidjnap00@yahoo.com,,Languages: Haitian Creole,former-student,71,71
Bianca,Gloss,biancagloss2@gmail.com,,Languages: Spanish,alumni,71,71
Camilla,Guarana,camillafng@gmail.com,,Languages: Portuguese,alumni,71,71
Anthony,Hernandez,anthonyhdz23@icloud.com,,Languages: Spanish,alumni,71,71
Sonia,Lawrence,sonia_ap17@icloud.com,,Languages: Spanish,alumni,71,71
Ha,Mac,macvietha72@gmail.com,,Languages: Vietnamese,alumni,71,71
Grace,Matos,gracedobrasil@gmail.com,,Languages: Portuguese,alumni,71,71
Gisela,Medina Martínez,gisempr@icloud.com,,Languages: Spanish,former-student,71,71
Gilma,Mendosa,gilmamendosa1@gmail.com,,Languages: Spanish,alumni,71,71
Carmen,Morales,c.n.morales010@gmail.com,,Languages: Spanish,alumni,71,71
Mary,Mounir,mwmounir@yahoo.com,,Languages: Arabic,alumni,71,71
Aimee,Munoz,amunozrosales11@gmail.com,,Languages: Spanish,alumni,71,71
Karla,Munoz,karlamsalinas88@gmail.com,,Languages: Spanish,alumni,71,71
Enrique,Olvera-Garcia,kekay69@hotmail.com,,Languages: Spanish,former-student,71,71
Marisol,Osorio,mari16osorio@gmail.com,,Languages: Spanish,alumni,71,71
Jesus,Pardo,pardoj420@gmail.com,,Languages: Spanish,alumni,71,71
Jil,Patel,jilpatel201@gmail.com,,,former-student,71,71
Katherine,Portorreal,esperanza.p.s@icloud.com,,Languages: Spanish,former-student,71,71
Mateo,Prieto Martinez,mateopmtz@icloud.com,,Languages: Spanish,alumni,71,71
Yasmeen,Qafaan,yasmeen.qafaan@gmail.com,,Languages: Arabic,alumni,71,71
Jabnia,Roman,mjabnia77@gmail.com,,Languages: Spanish,alumni,71,71
Mervat,Wahhab,mrvtwahhab90@gmail.com,,Languages: Arabic,alumni,71,71
Arturo,Almanza,aalmanza1730@gmail.com,,Languages: Spanish,alumni,70,70
Patricia,Alvarado González,pattyealvarado@gmail.com,,Languages: Spanish,alumni,70,70
Lina Mediatrix,Baar,medybaar@gmail.com,,"Languages: Tagalog, Cuyonon, and Ilonggo",alumni,70,70
Halima,Bah,bahhalima91@gmail.com,,Languages: French,former-student,70,70
Kadiatu,Barrie,kadiatu88@yahoo.com,,Languages: Fulani,former-student,70,70
Dilmaya,BK,dilmaya006@gmail.com,,,alumni,70,70
Yajaira,Carrasco,carrascoyajaira@gmail.com,,Languages: Spanish,alumni,70,70
Niurka,Clavero Miraz,niurkaclavero@yahoo.es,,Languages: Spanish,former-student,70,70
Emma,Cox,emmamariecox@gmail.com,,Languages: Spanish,alumni,70,70
Rosario,Cruz Cervantes,rosariocruz0907@gmail.com,,Languages: Spanish,alumni,70,70
Bekele,Dako,bekelegerba3@gmail.com,,Languages: Amharic and Afan Oromo,alumni,70,70
Karla,Figueroa,kfigueroa218@gmail.com,,Languages: Spanish,alumni,70,70
Amia,Gibson,amia.envision@gmail.com,,Languages: Spanish,former-student,70,70
Grace,Giurici,ggiurici@gmail.com,,Languages: Romanian,alumni,70,70
Dulce,Gonzalez,dulce8689@yahoo.com,,Languages: Spanish,alumni,70,70
Giovanni,Gonzalez,giovannig02042006@gmail.com,,Languages: Spanish,alumni,70,70
Joselin,Guerrero,joselinguerrer529@gmail.com,,Languages: Spanish,alumni,70,70
Paloma,Ianes,ianespaloma@gmail.com,,Languages: Spanish,former-student,70,70
Sayed Babur,Jamal,baburjamal@yahoo.com,,Languages: Farsi,former-student,70,70
Jennifer,Lynn,j.lynn8507@gmail.com,,Languages: Spanish,alumni,70,70
Mariana,Machado,marianambalestrini@gmail.com,,Languages: Spanish,alumni,70,70
Melissa,Mendoza,melicken@gmail.com,,Languages: Spanish,alumni,70,70
Fanny Elizabeth,Moncada,fanny@moncadagroup.com,,Languages: Spanish,former-student,70,70
Marie,Morpeau,gmorpeau@yahoo.com,,"Languages: Haitian, French, Spanish",former-student,70,70
Natanun,Moses,natemoses19@gmail.com,,Languages: Spanish,former-student,70,70
Kissylane,Pires,kissylanepires@gmail.com,,Languages: Portuguese,former-student,70,70
Claudia,Roa,roacl0817@gmail.com,,Languages: Spanish,alumni,70,70
Andrea,Salazar,msandrea.sal@gmail.com,,Languages: Spanish,alumni,70,70
Veronica,Santana,santana0711@yahoo.com,,Languages: Spanish,alumni,70,70
Katrina,Stubbs,katrinalynn513@icloud.com,,Languages: Spanish,former-student,70,70
Miryam,Torres,miriam.t.mt@gmail.com,,Languages: Spanish,alumni,70,70
Ying Ying (Vanya),Wu,vanyayw@gmail.com,,"Languages: Mandarin Chinese, Taiwanese",alumni,70,70
Rui Mei,Zhu,ruimei2006@gmail.com,,Languages: Cantonese,alumni,70,70
Evelin,Zuniga,zunigaevelin187@gmail.com,,Languages: Spanish,alumni,70,70
Carina,Arroyo-Guerrero,carina.arroyo84@gmail.com,,Languages: Spanish,alumni,69,69
Corina,Cedeno Espinosa,corinacedeno6@gmail.com,,Languages: Spanish,alumni,69,69
WeiHsian(Casey),Chiang,weicasey@gmail.com,,Languages: Chinese,alumni,69,69
Adriana,De Leon,ortizadriana8@gmail.com,,Languages: Spanish,alumni,69,69
Sara,Diaz,saradiazudes@gmail.com,,Languages: spanish,former-student,69,69
Robert,Francois,robert15gen@gmail.com,,Languages: Creole,former-student,69,69
Sebastian E,Girado,sebas.girado@outlook.com,,Languages: Spanish,alumni,69,69
Liliana,Gonzalez,liliana017gonzalez@gmail.com,,Languages: Spanish,alumni,69,69
Jackson,Haun,jacksonhaun@gmail.com,,Languages: Spanish,alumni,69,69
Saeda,Ibaid,saedaibaid@yahoo.com,,Languages: Arabic,former-student,69,69
Justin,Kim,meadowskier@gmail.com,,Languages: Korean,alumni,69,69
Maria,Lisienkova,maria.lisienkova@gmail.com,,Languages: Russian,former-student,69,69
Daniel,Lopez,dlopezx54@gmail.com,,Languages: Spanish,former-student,69,69
Arturo H,Lopez Jr,tury217@comcast.net,,Languages: Spanish,former-student,69,69
Stella,Martins,martins.stella20@yahoo.com,,Languages: Igbo and Yoruba,alumni,69,69
Monica,Medina,monica.diaz214@gmail.com,,Languages: Spanish,alumni,69,69
Saine,Michel,sainemichel92@gmail.com,,Languages: Spanish,alumni,69,69
Sheila,Michel,sheilamichel01@gmail.com,,Languages: Spanish,alumni,69,69
Maria,Moncada,moncadam1505@gmail.com,,Languages: Spanish,alumni,69,69
Glenda,Mucia,glendamcoz@gmail.com,,Languages: Spanish,alumni,69,69
Misael,Navarro,bayareamisael@gmail.com,,Languages: Spanish,former-student,69,69
Quỳnh,Như,drquynhnhu2014@gmail.com,,Languages: Vietnamese,alumni,69,69
Marlee,Rushing,marleemom1010@gmail.com,,Languages: ASL,alumni,69,69
Sokhun,Thach,sokhunsong@yahoo.com,,Languages: Khmer,alumni,69,69
James,Thompson,thompson.sojin@gmail.com,,Languages: Spanish,alumni,69,69
Norma,Torres,my3angelz0420@yahoo.com,,Languages: Spanish,alumni,69,69
Yanmei,WangChang,jdcw239@hotmail.com,,Languages: Chinese,alumni,69,69
Doua,Yang,yang.doua@gmail.com,,Languages: Hmong,alumni,69,69
María Fernanda,Carreras,fercarreras27@hotmail.com,,Languages: Spanish,former-student,68,68
Sabra,Choudhry,sabrachoudhri@yahoo.com,,"Languages: Urdu, Hindi, Punjabi, Saraiki, Hinko",alumni,68,68
Michelle,Colon,michellecolon150@gmail.com,,Languages: Spanish,former-student,68,68
Stephanie,Decasas,decasas.steph@gmail.com,,Languages: Spanish,alumni,68,68
Chris,Ferri,xtian13@gmail.com,,Languages: Spanish,alumni,68,68
Vlada,Galyan,lada.galyan14@gmail.com,,Languages: Ukrainian Russian,alumni,68,68
Helene,Huynh,hhuynh2194@zoho.com,,Languages: Cantonese,alumni,68,68
Maria,Jimenez Carmona,m.jimkar@gmail.com,,,alumni,68,68
Junayd,Khattak,junayd111@myyahoo.com,,Languages: Arabic,former-student,68,68
Marie,Kime,mariadeliax@yahoo.com,,Languages: Spanish,alumni,68,68
Marcelo,Littuma,mrcllttm@gmail.com,,Languages: Spanish,alumni,68,68
Jaime,Magana,jaimemagana1203@gmail.com,,Languages: Spanish,alumni,68,68
Janeli,Melendez,janelim86@gmail.com,,Languages: Spanish,alumni,68,68
Cindy,Mota,cmota859@gmail.com,,Languages: Spanish,former-student,68,68
Jose david,Ortega Carcano,carcanojd@yahoo.com,,Languages: Spanish,alumni,68,68
Franco,Padua,francoupr@gmail.com,,Languages: spanish,alumni,68,68
Alejandro,Perez,18aperez120@gmail.com,,Languages: Spanish,alumni,68,68
Carolina,Reina,reinabc1990@gmail.com,,Languages: spanish,alumni,68,68
Mahdieh,Rodriguez,mahrod3065@gmail.com,,Languages: Farsi,alumni,68,68
Barbara,Sanchez,barbara.depaz140193@gmail.com,,Languages: Spanish,alumni,68,68
Mariana,Sanders,marianasanders2@gmail.com,,Languages: Spanish,alumni,68,68
Gerardo,Suarez,laloinator@icloud.com,,Languages: Spanish,former-student,68,68
Dong,Tran,vince.m.tran518@gmail.com,,Languages: Vietnamese,alumni,68,68
Nay Ciray,Valbuena,ncvpav@gmail.com,,Languages: Spanish,alumni,68,68
Jefferson,Vasquez-Reyes,jeffersonvasquezreyes@gmail.com,,Languages: Spanish,alumni,68,68
Yu-Hsin,Wan,yuhsinwan@gmail.com,,Languages: Mandarin Chinese,alumni,68,68
Huab,Xiong,huab.xiong@gmail.com,,Languages: Hmong,former-student,68,68
Seniha,Yildirim,senihayildirim@gmail.com,,Languages: Turkish,alumni,68,68
Kristina,Ahmetlli,ahmetllikristina@gmail.com,,Languages: Albanian,alumni,67,67
Angineh,Babkhanian,angie.bsb@gmail.com,,Languages: Farsi,former-student,67,67
Iliana,Calles,zayitcalles@gmail.com,,Languages: Spanish,former-student,67,67
Cristopher,Esparza Tortolero,frijolfeliz@gmail.com,,Languages: Spanish,alumni,67,67
Samuel,Guzman,samguzman621@gmail.com,,Languages: Spanish,alumni,67,67
Clementina,Guzman Heredia,gclementina10@gmail.com,,Languages: Spanish,alumni,67,67
Michelle,Kim,michellesohyunkim@gmail.com,,Languages: Korean,alumni,67,67
Suada,Mansouri,suadaman@gmail.com,,"Languages: Serbian, Bosnian",alumni,67,67
Christopher,Medina,chris.14.medina@icloud.com,,Languages: Spanish,alumni,67,67
Krisztina,Miller,krisztina207@gmail.com,,Languages: Hungarian,former-student,67,67
Camila,Olaya,camilaolayacuervo@gmail.com,,Languages: Spanish,alumni,67,67
Patricia,Pierre Louis,plouis9231@gmail.com,,Languages: Creole,former-student,67,67
Michael,Rivera,mriveramiranda3118@gmail.com,,Languages: Spanish,alumni,67,67
Patricia,Rodas Dunbar,patyrodas16@gmail.com,,Languages: Spanish,alumni,67,67
Mildred,Rodriguez,mjcolon1982@gmail.com,,Languages: Spanish,former-student,67,67
Nagibullah,Sahim,sahimnagib@gmail.com,,Languages: Farsi (Dari).,former-student,67,67
Setu,Tamang,mongertamang@gmail.com,,Languages: Nepali,former-student,67,67
Naomie,Thamuk,naomiet30@gmail.com,,Languages: French,former-student,67,67
Anastasiya,Tikhonenko,anastasiya.tikhonenko@gmail.com,,Languages: Russian,alumni,67,67
Luis,Vasquez,luisale0302@gmail.com,,Languages: Spanish,alumni,67,67
Wadson,Alabre,alabrewadson@gmail.com,,Languages: French & Creole,alumni,66,66
Eduardo,Carty,eds.current@gmail.com,,Languages: Spanish,alumni,66,66
Catphuong,Felix,catfelix216@gmail.com,,Languages: Vietnamese,alumni,66,66
Bianca,Goglas,caregirl2003@yahoo.com,,Languages: Spanish,alumni,66,66
Virginia,Gonzalez,virginia9937@att.net,,Languages: Spanish,alumni,66,66
Jennifer,Hernandez,jenn.rick9086@gmail.com,,Languages: Spanish,former-student,66,66
Isaac,Johnson,languagetutor102@gmail.com,,Languages: Spanish,alumni,66,66
Ruth,Lanausse,rlanausse@gmail.com,,Languages: Spanish,alumni,66,66
Carlos,Larios,return2fury@gmail.com,,Languages: Spanish,alumni,66,66
Larissa,Martinez,larissaluna504@gmail.com,,Languages: Spanish,alumni,66,66
Rocio,Martinez,martinezr080691@gmail.com,,Languages: Spanish,alumni,66,66
Kelly,Murillo,kmurillo0210@outlook.com,,Languages: Spanish,alumni,66,66
Erik Benjamin,Muro,erikmuro9@gmail.com,,Languages: Spanish,alumni,66,66
Sonia,Navarro,snavarro68@icloud.com,,Languages: Spanish,former-student,66,66
Rebeca,Neri,bekineri100@gmail.com,,Languages: Spanish,former-student,66,66
Aurora,Nesby,aurora9496@gmail.com,,Languages: Spanish,alumni,66,66
Karla,Palacios,karlapalacios2@gmail.com,,Languages: Spanish,alumni,66,66
kimberly,partida,kimmy.kim.1021@icloud.com,,Languages: Spanish,former-student,66,66
Christian,Pineda,christianpineda317@gmail.com,,Languages: Spanish,alumni,66,66
Asuncion,Preciado,asuncion4449@gmail.com,,Languages: Spanish,alumni,66,66
blanca,ramirez,bramirezlola@gmail.com,,Languages: Spanish,alumni,66,66
Angelica,Rivera,angelica.rivera90@yahoo.com,,Languages: Spanish,former-student,66,66
Camilo,Rodriguez Perez,c.rdriguez88@outlook.com,,Languages: Spanish,alumni,66,66
Jeycyn,Santiago,jeycynsantiago2002@gmail.com,,Languages: Spanish,alumni,66,66
Zohreh,Shirmohammadi,zohreh.shm@gmail.com,,Languages: Farsi,alumni,66,66
Ademildo,Silva,ademildo386@gmail.com,,Languages: Spanish,alumni,66,66
Victoria,Tavares,mvtavares77@gmail.com,,Languages: Portuguese,former-student,66,66
Talita,Toto,talitatoto@icloud.com,,"Languages: Portuguese, spanish",former-student,66,66
Luis A,Villanueva Cordero,luisvill32@gmail.com,,Languages: Spanish,alumni,66,66
Valerie,Williams,valerielucero23@gmail.com,,Languages: Spanish,alumni,66,66
Iman,Ali,umbilal2000@yahoo.com,,Languages: Arabic,former-student,65,65
Mahammad,Ansari,itsmeajaj@gmail.com,,"Languages: Nepali, Hindi",alumni,65,65
Rosalia,Arroyo,rosaliaarroyo8@gmail.com,,Languages: Spanish,alumni,65,65
Daniel,Beltrán,danielnbeltran@gmail.com,,Languages: Spanish,alumni,65,65
Svetlana,Calcote,suava1983@gmail.com,,Languages: russian,alumni,65,65
Rosa,Cohen Zhang,cohen.hernandezzz@gmail.com,,Languages: Spanish,former-student,65,65
Monthila,Detoudom,dmonthila@gmail.com,,Languages: Lao,alumni,65,65
Irina,Fleming,iultinka@yahoo.com,,Languages: Russian,alumni,65,65
Siham,Ghaoui,hibabegaa@gmail.com,,Languages: Arabic,alumni,65,65
Daniel,Greene,daniel.nathan.greene@gmail.com,,Languages: Spanish,alumni,65,65
Michelle,Henry,michelle.roblesleon@gmail.com,,Languages: Spanish,alumni,65,65
Aika,Hida,ahida@uci.edu,,Languages: Japanese,alumni,65,65
Umme,Hoque,zhoque1127@gmail.com,,Languages: Bangla,alumni,65,65
Sol,Jimenez,sajimenez84@gmail.com,,Languages: Spanish,alumni,65,65
Pablo Helit,Jimenez Phillips,phjp66@gmail.com,,Languages: Spanish,alumni,65,65
Abby,Kamler,abby_k16@outlook.com,,Languages: Japanese,alumni,65,65
Andrea,Lara,alelaca17@hotmail.com,,,alumni,65,65
Katherine,Lopez,klopez182@gmail.com,,Languages: Spanish,alumni,65,65
Jennifer,Mai,jenni8232004@yahoo.com,,Languages: Vietnamese,alumni,65,65
Suhay,Martinez,suhaym10@gmail.com,,Languages: Spanish,alumni,65,65
Katherine,Martinez,katherine_martinez33@hotmail.com,,Languages: Spanish,alumni,65,65
Laura,Matias,lauram983@gmail.com,,Languages: Spanish,former-student,65,65
Damaris,Perez,dnperez98@gmail.com,,Languages: Spanish,former-student,65,65
Jessica,Plata,jediaz17@gmail.com,,Languages: Spanish,alumni,65,65
jennifer,ramirez,jenniferedith19@gmail.com,,Languages: Spanish,alumni,65,65
Rozita,Refa,refarozita@gmail.com,,Languages: Persian,alumni,65,65
Ruth,Restrepo,ruthrestrepo@hotmail.com,,,alumni,65,65
Cecilia,Ruiz,cecilia.ruiz1915@gmail.com,,Languages: Spanish,alumni,65,65
Joanne,Torres,joanne.torresc@gmail.com,,Languages: Spanish,alumni,65,65
Samir,Abdullah,samir.abdullah71@yahoo.com,,,alumni,64,64
Veronica,Aguirre,veronica.aguirre288@gmail.com,,,alumni,64,64
Rocio,Arciniega,idaliemily21@icloud.com,,,alumni,64,64
Nicholas,Balingit,nickabalingit@gmail.com,,,alumni,64,64
Chafia,Benchekribou,chaftita@yahoo.com,,,alumni,64,64
Arturo,Carrillo,ascarrillo87@gmail.com,,,alumni,64,64
Khady,Diop,khadylay@hotmail.fr,,,alumni,64,64
Halime,Doudji,hdoudji84@gmail.com,,,former-student,64,64
Thi,Duong,thuyduong109@gmail.com,,,alumni,64,64
Henry,Fajardo,hfajardo1998@gmail.com,,,alumni,64,64
Raquel,Flores,raquelflores0601@gmail.com,,,alumni,64,64
Maritza,Garcia Torres,venpues2000@hotmail.com,,,alumni,64,64
Julia,Guerra,guerraj96@gmail.com,,,former-student,64,64
Humlyse,Jeanty,humlyse@gmail.com,,,alumni,64,64
Luke,Kung,ljkung@yahoo.com,,,former-student,64,64
Rebeca Arisai,Mendoza,beckymendoza1102@gmail.com,,,alumni,64,64
Laura,Nemat,laurahigazin@gmail.com,,,alumni,64,64
Yazmin,Nieves,yazmin.nieves0829@gmail.com,,,alumni,64,64
Evgeny,Nikitin,evgeny.nikitin.1982@gmail.com,,,alumni,64,64
Nexwan,Norelus,nnorelus1@gmail.com,,,alumni,64,64
Claudia Vanessa,Noyola Salas,v.noyola96@gmail.com,,,former-student,64,64
Flor,Quintana,0014.victoria.quintana@gmail.com,,,alumni,64,64
Jasmine,Sanchez,jasmine.mendez16@gmail.com,,,alumni,64,64
Nhan,Tran,sarnoffrl@gmail.com,,,alumni,64,64
Samantha,Yanez Hill,syanezhill@gmail.com,,,alumni,64,64
Meng,Yang,yajmengis@gmail.com,,,alumni,64,64
Andrea,Acosta,andimiri@hotmail.com,,,alumni,63,63
Karina,Alexander,karinaalexanderc19@hotmail.com,,,former-student,63,63
Xenia,Alvarado,xeniaalvarado77@gmail.com,,,alumni,63,63
Francisco De Borja,Dorsch,borjacaballerodelacuadra@gmail.com,,,alumni,63,63
Andrea Roxana,Flores Lahore,andrearoxanafloreslahore@yahoo.com,,,alumni,63,63
Olivier,Francois,olifrancois127@hotmail.com,,,former-student,63,63
Liliana,Giraldo,osliosna@verizon.net,,,alumni,63,63
Guenet,Haile,guenet_haile@yahoo.com,,,alumni,63,63
Gere,Haile,gere0911342825@gmail.com,,,alumni,63,63
Sonia,Herrera,shstar85@yahoo.com,,,alumni,63,63
Tedy,Joisil,jboyyellow@gmail.com,,,alumni,63,63
Millie,Medina,medina0120@gmail.com,,,alumni,63,63
Rosalias,Mercedes Zabala,rosaliasmz@gmail.com,,,alumni,63,63
Geisa Cristina,Santos Carneiro Williams,geisacristina7@gmail.com,,,alumni,63,63
Anastasiia,Sashkova,a.sashkova98@gmail.com,,,former-student,63,63
Vianey,Vasquez,vianey.alejandro789@hotmail.com,,,alumni,63,63
Eunice,Aguilar,gwap099@yahoo.com,,,former-student,62,62
Desiree,Alvarez,desireealvarez323@icloud.com,,,former-student,62,62
Vicente,Arellano,vicarel.45@icloud.com,,,alumni,62,62
Mohammadjavad,Askari,johnny10ar@yahoo.com,,,alumni,62,62
Jonathan,Beatriz,jonathanbch0329@gmail.com,,,alumni,62,62
wolansa,befekadu,wol.yona@gmail.com,,,alumni,62,62
Iuliia,Bezara Zhuk,077juliaz@gmail.com,,,former-student,62,62
Tesalia,Bonilla,tesalia.d.bonilla@gmail.com,,,alumni,62,62
Maria,Builes,meraz.td76@gmail.com,,,former-student,62,62
Lorena,Cabezas,lorena-cabezas@hotmail.com,,,alumni,62,62
Suellen,Da Cruz,suellencruz1@hotmail.com,,,former-student,62,62
Wondimu,Deyasso,wondimugeda@gmail.com,,,alumni,62,62
Ana Julia,Dunphy,richardandanadunphy@gmail.com,,,former-student,62,62
Maria-Pia,Farh,mariapiafarah@gmail.com,,,alumni,62,62
Isabelita,Gonzalez,lafresca1971@yahoo.com,,,former-student,62,62
Wing Yan,Hung,whung09@gmail.com,,,alumni,62,62
Kieu,Huynh,kieuhuynh1q@gmail.com,,,alumni,62,62
Ethel,Jovic,ekcastro76@gmail.com,,,alumni,62,62
Jobelle,Kabombo,jobellek@gmail.com,,,alumni,62,62
Bertha,Martinez,sanaandocorazones@gmail.com,,,former-student,62,62
Ryan,Maurera,rtmaurera@gmail.com,,,alumni,62,62
Evelyn,Mejia,evelynchavez75@gmail.com,,,alumni,62,62
Adolfo,Moreno,ofunsagnia@gmail.com,,,alumni,62,62
Luciany,Morgado,luberta@gmail.com,,,former-student,62,62
Yvette,Navarrete,yvenav65@yahoo.com,,,former-student,62,62
Brenda,Perez,breperez1975@yahoo.com,,,alumni,62,62
Michelle,Ponce,michelle_ponce410@yahoo.com,,,alumni,62,62
Stephanie,Vincent,stephanie.joachim90@gmail.com,,,alumni,62,62
Taras,Zakharchyn,t.zakarchyn86@gmail.com,,,alumni,62,62
Eneida,Agosto,agostoe@hotmail.com,,,former-student,61,61
Josue,Aguirre,jdanny530@gmail.com,,,former-student,61,61
Sahar,Ahmadi,saharahmadi6111@yahoo.com,,,alumni,61,61
Azucena,Arredondo,suzyarredondo@gmail.com,,,alumni,61,61
Ahmad,Aryan,ahmadshaharyan@gmail.com,,,alumni,61,61
Sarra,Ayari,sarraayari590@gmail.com,,,alumni,61,61
Edwin,Blanton,earthecartoonist@gmail.com,,,former-student,61,61
Andrew,Bullock,aab7855@yahoo.com,,,former-student,61,61
Annabelly,Carpenter,yaromit@gmail.com,,,alumni,61,61
Ana,Dominguez,godoracing@live.com,,,alumni,61,61
Soraya,Ducharme,soraya_ducharme@yahoo.com,,,alumni,61,61
Beatriz,Flores,flores.bea429@gmail.com,,,former-student,61,61
Safae,Guerrouj,safae.guerrouj@gmail.com,,,alumni,61,61
Claudia,Hollinger,claudiahollinger1986@gmail.com,,,alumni,61,61
Estreya,Lopez,estreya_lopezbaca@outlook.com,,,former-student,61,61
Mariana,Lopez Garcia,lopezmariana83@gmail.com,,,alumni,61,61
Gloria,Manzano,gmanzano8370@gmail.com,,,former-student,61,61
Trevor,McCoy,trevormccoy1@gmx.com,,,former-student,61,61
Rahmatullah,Nabizada,rahmat.nabizada1@gmail.com,,,alumni,61,61
Mikeisha,Negron Ortiz,negronmikeisha19@gmail.com,,,alumni,61,61
Cristina,Orozco,orozcocristina85@gmail.com,,,alumni,61,61
Lourdes,Perez,lurias530.lu@gmail.com,,,former-student,61,61
Nancy,Persad,npersad22@gmail.com,,,former-student,61,61
Laura,Rodriguez,laura.maribel053@gmail.com,,,former-student,61,61
Gilda,Santos,gildafofa@outlook.com,,,former-student,61,61
Mariana,Sierra Ramirez,marisialeja24@gmail.com,,,alumni,61,61
Cristina,Vazquez,prispis@icloud.com,,,former-student,61,61
Carlos,Vera Vargas,carlosdanielvera0801@gmail.com,,,alumni,61,61
Jean,Vizcarrondo,vizcarrondojean@yahoo.com,,,former-student,61,61
Erika,Yanes,erikasyanes@gmail.com,,,alumni,61,61
Inabel,Acosta,miguel.inabel@gmail.com,,,alumni,60,60
July,Alvarez,julyalvarez04@live.com,,,alumni,60,60
Ana,Baraja de Meireles,anabbarajas@yahoo.com,,,former-student,60,60
Mary anne,Barajas,barajasmd7@gmail.com,,,alumni,60,60
Sun,Barnthouse,pearlynavygirl@gmail.com,,,alumni,60,60
Viridiana,Barron,viribarron88@gmail.com,,,alumni,60,60
Abril,Cantilo,abrilcantilo@gmail.com,,,alumni,60,60
Maria Cristina,Capri Bosch,ccge101@gmail.com,,,alumni,60,60
Rashel,Cardoso,rashel.cardoso@yahoo.com,,,former-student,60,60
Erika,Cazares,erika.cazares1997@gmail.com,,,alumni,60,60
Caio,Damaceno,caiorock@gmail.com,,,alumni,60,60
Andrea,Diaz Perez,adpere01@gmail.com,,,alumni,60,60
Nandini,Dutta,y2kdutta@gmail.com,,,alumni,60,60
Ruthnose,Elidor,ruthelidor096@gmail.com,,,alumni,60,60
Beatriz,Gonzalez Renedo,beatrizgonzalezrenedo@gmail.com,,,alumni,60,60
Eliana,Guevara,e.guevara120@yahoo.com,,,former-student,60,60
Diana,Kaman,dianakaman0@gmail.com,,,alumni,60,60
Joana,Lopez,joanacervantes123@gmail.com,,,alumni,60,60
Luis,Melecio,lulucapetillo@gmail.com,,,alumni,60,60
Gillian,Morales,gmichellleon.valdez@gmail.com,,,former-student,60,60
Dora,Ocon,oconodora@yahoo.com,,,former-student,60,60
Karol,Perez,kperez6628@gmail.com,,,alumni,60,60
Claudia,Perez-Pineda,cpluna12@gmail.com,,,former-student,60,60
Ana Karen,Ruiz Velasco Pulido,anakarenrvp1321@gmail.com,,,alumni,60,60
Rubin,Sainvil,ilbet9@hotmail.com,,,former-student,60,60
Liliana,Santamaria,lilisantamariah@gmail.com,,,alumni,60,60
Yousaf,Sherzad,yousaf.sherzad1111@gmail.com,,,alumni,60,60
Jineth,Villeda,jinethvilleda@gmail.com,,,alumni,60,60
Alanis,Araujo,alanisisabela2002@gmail.com,,,alumni,59,59
Leslie,Beard,leslieares.98.7@gmail.com,,,alumni,59,59
Maria,Callente,mariacallente@att.net,,,former-student,59,59
Dorenhy,Condado,dorenhy.condado@gmail.com,,,alumni,59,59
Francisco De Borja,Dorsch,borchcc@hotmail.com,,,former-student,59,59
Kerson,Elidor,elodorkerson@yahoo.fr,,,former-student,59,59
Ana,Gambetta,anaedithlopez31@gmail.com,,,alumni,59,59
Jessica,Garcia,jessica.jjmedia@gmail.com,,,alumni,59,59
Sandra,Georgi,sivudata@gmail.com,,,former-student,59,59
Alfio,Lococo,alfiolococo@gmail.com,,,alumni,59,59
Fnu,Meraj,fnumeraj2003@gmail.com,,,former-student,59,59
martha,Mock,martha1956diaz@gmail.com,,,alumni,59,59
Atta,Mohammad,m.attamohammad@gmail.com,,,former-student,59,59
Claudia,Molina,molin3claudia@gmail.com,,,alumni,59,59
Marina,Nascimento Mendonca,marinainascimentom@gmail.com,,,alumni,59,59
Carlos,Perez,sidboco@gmail.com,,,alumni,59,59
Phuong,Pham,phuongpipi999@gmail.com,,,alumni,59,59
John,Profaci,profaci747@gmail.com,,,former-student,59,59
Grecia,Reyes Delgado,greciarede@gmail.com,,,alumni,59,59
Hector,Santiago,santiagoh838@gmail.com,,,former-student,59,59
Zabiaknguri,Sevcik,ngurtei@gmail.com,,,alumni,59,59
Sangita,Shahani,sangitashahani@yahoo.com,,,alumni,59,59
Rosa,Taveras,rosat5223@yahoo.com,,,former-student,59,59
Jeanette,Vargas,scooby-jina@hotmail.com,,,former-student,59,59
Juan,Arevalo,juan.j.arevalo@gmail.com,,,former-student,58,58
Ivonne,Caro,ivonn_cr_99@hotmail.com,,,former-student,58,58
Georgina,Castaneda,castanedag983@gmail.com,,,alumni,58,58
Cristian,Chavez,cristianchavezzz@hotmail.com,,,alumni,58,58
Malalthlansui,Cottrell,mimisuite@gmail.com,,,alumni,58,58
Fatima,El Wakil,fatima.wakeel5oct@gmail.com,,,alumni,58,58
Jessica,Espinoza,jessi.espinoza.21@icloud.com,,,former-student,58,58
Evelyn,Espinoza,espinozaevelyn44@gmail.com,,,alumni,58,58
Tina,Garmo,tinagarmo@yahoo.com,,,alumni,58,58
Farah,Haidar,farah--haidar@outlook.com,,,alumni,58,58
Gabriella,Holley,gabbago56@gmail.com,,,alumni,58,58
Jeralyn,Jaramillo,jaramillojeralyn541@gmail.com,,,former-student,58,58
Kanku,Kasongo,kasongokanku@gmail.com,,,former-student,58,58
Zuly,Kimball,zarroyoc@icloud.com,,,former-student,58,58
DoanThaoMy,Le,letmy91@gmail.com,,,alumni,58,58
Iboja,Monar,monar.ibi@gmail.com,,,alumni,58,58
Maria Irene,Moyna,moyna@tamu.edu,,,former-student,58,58
Lina,Ojeda,ojedalina@hotmail.com,,,former-student,58,58
Catherine,Ortiz,catherine.ortiz0921@gmail.com,,,alumni,58,58
Abdellah,Rafi,anis.rafei.aar@gmail.com,,,alumni,58,58
Guissel,Rebollar,rebollargiselle@gmail.com,,,former-student,58,58
Genesis,Rosa Godoy,gene96godoy@gmail.com,,,alumni,58,58
Joanna,Salgado,sjoannag100@gmail.com,,,alumni,58,58
Maria,Sernas,fernanda.sernas@yahoo.com,,,former-student,58,58
Bikram,Subba,bikeyk@gmail.com,,,former-student,58,58
Karla,Teodoro,alrakdiaz@yahoo.com,,,former-student,58,58
Ramses,Valle,ramsesvalle@yahoo.com,,,former-student,58,58
Lionel,Betancourt,liogrizzlygang@gmail.com,,,former-student,57,57
Sandra,Carrasso,scarrasso216@gmail.com,,,alumni,57,57
Edwin,Castillo Hernandez,edwin95castillo@gmail.com,,,alumni,57,57
Cleydi,Chavez,cleydic256@gmail.com,,,alumni,57,57
Jenna,Cochran,bernabei.jenna@gmail.com,,,alumni,57,57
Kimberly,Escobar,wookawooky11@gmail.com,,,alumni,57,57
Emmanuel,Fefe,emmanuelfefe02@hotmail.com,,,former-student,57,57
Cesar E,Figuereo Almonte,eliezerfa09@gmail.com,,,alumni,57,57
Sophia,Gonzalez,gsophia0310@gmail.com,,,alumni,57,57
Anny Steffy,Gracius,graciusanny@gmail.com,,,alumni,57,57
Mario,Gutierrez,mario@aalb.org,,,former-student,57,57
Solange,Hernandez,solh69@gmail.com,,,alumni,57,57
Dalis,Johnson,troyjohnson716@gmail.com,,,alumni,57,57
Jennifer,Luong,jenny.luong.3989@gmail.com,,,alumni,57,57
Fabiola,Martinez,fabmpernas@hotmail.com,,,former-student,57,57
Claudia,Martinez,clachiquim@yahoo.com,,,former-student,57,57
Diego,Medina,medina.diego285@gmail.com,,,alumni,57,57
Noe',Neaves Jr MD,noeneavesjr@gmail.com,,,alumni,57,57
Janitza,Peña,janitza123p@gmail.com,,,former-student,57,57
Sarahi,Pitones,sarahipitones@yahoo.com,,,alumni,57,57
Sara,Quiroga,sarar.quiroga@gmail.com,,,alumni,57,57
Jessica,Rodriguez,rodriguez7700@gmail.com,,,alumni,57,57
Aurelie,Roy,aurelieroykine@gmail.com,,,alumni,57,57
Miryam,Ruvalcaba,miryam4848@gmail.com,,,alumni,57,57
Ngoc,Tran,bichngoctran309@gmail.com,,,alumni,57,57
Wahedullah,Ulfat,w.au2008@gmail.com,,,alumni,57,57
Isaac,Vargas,vargasisaac035@gmail.com,,,alumni,57,57
Gloria,Vasquez,gloriav17@yahoo.com,,,alumni,57,57
Honora,Wache,honora.dw@gmail.com,,,former-student,57,57
Francielle,Allred,franciele.allred@gmail.com,,,alumni,56,56
David,Anguiano,dar.kc.g97@gmail.com,,,former-student,56,56
Otoniel,Arreaga,otoarreaga@gmail.com,,,alumni,56,56
Marcos,Caballero,marcos.a.caballero@hotmail.com,,,alumni,56,56
Elsa,Contreras,elsacon92@gmail.com,,,former-student,56,56
Angela,Cordoba-Flores,acordobaflores1@gulls.salisbury.edu,,,alumni,56,56
Alondra,Diaz,alodiaze@icloud.com,,,alumni,56,56
Mohamed,Diouf,mld92@yahoo.com,,,former-student,56,56
Jazmin,Flores,flojaz55@gmail.com,,,alumni,56,56
Yezenia,Huaman-Flores,y.z.huaman@gmail.com,,,former-student,56,56
Nooreia,Khairzada,nooreia@gmail.com,,,alumni,56,56
Erika,Knodler,knodlererika@gmail.com,,,former-student,56,56
Bridget,Logan,bridyet.logan25@gmail.com,,,alumni,56,56
Ahmed,Mahamud,amahamud37@gmail.com,,,former-student,56,56
Fedra,Mahramas,fedramahramas@yahoo.gr,,,former-student,56,56
Daguihla,Mardy,djounesagesse1@gmail.com,,,former-student,56,56
Andres,Mesias,andresmmg27@gmail.com,,,alumni,56,56
Jacqueline,Meza,mezajacqueline06@gmail.com,,,alumni,56,56
Salvador,Murillo Perez,sal1721@outlook.com,,,former-student,56,56
Amar,Natsheh,natsheh.qamar.i@hotmail.com,,,alumni,56,56
Anisi,Ngongo,amissidaniel@gmail.com,,,alumni,56,56
Aymarani,Plasencia,amayraniplasencia03@gmail.com,,,former-student,56,56
Vanessa,Reyes Umanzor,vanessareyesu32@gmail.com,,,alumni,56,56
Ana,Roberts,anamilenaroberts@gmail.com,,,alumni,56,56
Lilia,Rohmann,liliarohbrio@gmail.com,,,alumni,56,56
Fanny,Roman,romanfanny49@gmail.com,,,former-student,56,56
Silvestre,Romos Llamas,silvestreromo3@gmail.com,,,alumni,56,56
Lana,Shaban,lshaban@su.suffolk.edu,,,alumni,56,56
Ahmed,Zaghloul,ahmedzahmedz0000@gmail.com,,,alumni,56,56
Sundus,abutahoun,satahoun@gmail.com,,,alumni,55,55
Nelson,Brauchitsch,n_brauchitsch@hotmail.com,,,former-student,55,55
Mariela,Cecilia Romero,maricy.110@gmail.com,,,alumni,55,55
Mao,Chhom,savon79@gmail.com,,,former-student,55,55
Mario,Codis,efrenmariocodis@gmail.com,,,former-student,55,55
Melissa,Cubias,mel8794_thebest@hotmail.com,,,former-student,55,55
Marlen,Flores,flores_marlen@yahoo.com,,,former-student,55,55
Maria Luz,Hernandez,lucysol77@gmail.com,,,alumni,55,55
Stephanie,Herrera,sticas29@comcast.net,,,former-student,55,55
George,Jean Louis,georgesjl89@gmail.com,,,former-student,55,55
Sonia,Khan,srofk@yahoo.com,,,former-student,55,55
Leslie,Lopez,lesliemorillo_@hotmail.com,,,former-student,55,55
Blanca,Loya,blancaloya70@gmail.com,,,alumni,55,55
Graciela,Marcia,graciemar79@yahoo.com,,,former-student,55,55
Rossy,martinez,rosy.gabriela09@gmail.com,,,alumni,55,55
Guadalupe,Medina,lupitalares26@gmail.com,,,former-student,55,55
Maria,Reynolds,mlrg7913@gmail.com,,,alumni,55,55
Victor,S.B.,v1ck05.sb@gmail.com,,,alumni,55,55
Martha,Sandoval,teto.chamoy@gmail.com,,,alumni,55,55
Gustavo,Serrano,gustavo_daniel00@outlook.com,,,alumni,55,55
Sebastian,Becker,sebastianbeckerhernandez@gmail.com,,,alumni,54,54
Karina,Gamboa,jfer.kari994@gmail.com,,,alumni,54,54
Luchele,Guess,luchekader@gmail.com,,,alumni,54,54
Shiraz,Hassan,hshiraz786@gmail.com,,,former-student,54,54
Parwiz,Mosawi,parweez_hakmat@yahoo.com,,,alumni,54,54
Didier,Ngoyi Ngoho,ngohod310@gmail.com,,,alumni,54,54
Nadia,Raikin,nadia_raikin@yahoo.com,,,alumni,54,54
Eric,Rivera,ejrivera08@gmail.com,,,alumni,54,54
Ruben,Rodriguez,rubenrodriguez182@gmail.com,,,alumni,54,54
Olga,Sanchez,olga.sanchez1107@outlook.com,,,former-student,54,54
Chunhua (Ivy),Schmidt,schmidtivy@gmail.com,,,former-student,54,54
Napawan,Srijunyanont,lektech2000@yahoo.com,,,former-student,54,54
Mariana,Trejo,matrema@gmail.com,,,former-student,54,54
Rosa,Villasenor Corona,rcorona139@gmail.com,,,alumni,54,54
Brenda,Aragon,brenda8474@hotmail.com,,,former-student,53,53
Nelson,Bonilla,nelsongokugomez19@gmail.com,,,alumni,53,53
Joyce,Cheung,joycecheungyy@gmail.com,,,former-student,53,53
Jennifer,Cornejo,cornejojennifer009@gmail.com,,,alumni,53,53
Sabina,Huivan,sabinnah@gmail.com,,,alumni,53,53
Jose,Mejia,josemauricio.mejia@gmail.com,,,alumni,53,53
Marcela,Mendez,mendezmarcy6@gmail.com,,,alumni,53,53
Salim,Nasr,salimnasr33@hotmail.com,,,former-student,53,53
Darlene,Ortiz,darlenedortiz@gmail.com,,,former-student,53,53
Alice,Rivera Torres,piercingpam112@gmail.com,,,alumni,53,53
Wendy,Rodriguez,wendy.alelhi.rodriguez@gmail.com,,,alumni,53,53
Jamis,Rojas,jamis.alvarez.2000@gmail.com,,,alumni,53,53
Heidi,Ronquillo,heidironquillo@yahoo.com,,,former-student,53,53
Diego,Sanchez,diegogiovanni1@gmail.com,,,alumni,53,53
Tomas,Vazquez,vazfather57.tv@gmail.com,,,alumni,53,53
Jahiedy,Vinas,jahiedy.vinas21@gmail.com,,,alumni,53,53
Lal,Awi,lalawi4tw@gmail.com,,,former-student,52,52
Alix,Bolanos-Gomez,alixg10@hotmail.com,,,former-student,52,52
Brenda,Carrillo,bcarrillo178@gmail.com,,,alumni,52,52
Cristina,Collazo,missmyss86@gmail.com,,,former-student,52,52
Diana,Cordoba,cordobadc28@gmail.com,,,alumni,52,52
Irmina,Domagala-Gront,irminasw@gmail.com,,,former-student,52,52
Rachelle,Dumay,rdumay75@gmail.com,,,alumni,52,52
Felicita (Felicia),Esquilin,feliciauniqueone@gmail.com,,,former-student,52,52
Maria,Fuentes,mfuentes81017@gmail.com,,,former-student,52,52
Ester,Gomero Tamayo,estergomerta@gmail.com,,,alumni,52,52
Ilias,Laoufir,arabicenglish3@gmail.com,,,alumni,52,52
Jeffrey,Leon,leonjeffrey25@gmail.com,,,alumni,52,52
Raquel,Lucena,raquellp@hotmail.com,,,former-student,52,52
Zainab,Mahdi,zeinab.mehdi@gmail.com,,,former-student,52,52
Ismael,Medina,izzmdna@gmail.com,,,former-student,52,52
Muhammad,Nazir,abbottabadnwfp@yahoo.com,,,former-student,52,52
Samsam,Sahardid,ssahardid@gmail.com,,,alumni,52,52
Cristina,Villarreal,cristina.mariee94@gmail.com,,,alumni,52,52
Maria,Avila,mariamurillo615@gmail.com,,,alumni,39,39
Natalia,Boiko,nboiko105@gmail.com,,,former-student,39,39
Iris,Castaneda,castanedairis@ymail.com,,,former-student,39,39
Franya,Fuentes McDonnell,franyacozari@icloud.com,,,former-student,39,39
Nayra,Garcia Alvarez,nlgarcia725@hotmail.com,,,alumni,39,39
Nicole,Gonzalez Beltran,ngbeltran92@gmail.com,,,alumni,39,39
Maria,Hernandez,h.maria196@yahoo.com,,,former-student,39,39
Andrea,Lopez,lopezandrea24@yahoo.com,,,former-student,39,39
Willian,Mora,morawillian1991@gmail.com,,,alumni,39,39
Tse,R,khanda8@gmail.com,,,former-student,39,39
Nereida,Salgado,nereidas1@gmail.com,,,former-student,39,39
EunSeon,Shim,christinekang75@gmail.com,,,former-student,39,39
Faridoon,Tahiri,faridoontahiri@gmail.com,,,former-student,39,39
Bao,Tran,jade207@yahoo.com,,,former-student,39,39
Laura,Borbely,mini_march7@yahoo.com,,,alumni,38,38
Azzedine,Boumeraou,yonovi-06@hotmail.fr,,,former-student,38,38
Lisseth,Calderon,lcal8892@gmail.com,,,alumni,38,38
Angeline,Charles,angeline.28@hotmail.com,,,alumni,38,38
Abigaelle,Deroneth,abigaellericky@gmail.com,,,alumni,38,38
Hedralissa,Garcia,hedralissaa@gmail.com,,,alumni,38,38
Amy,Lee,tlcmini@gmail.com,,,alumni,38,38
Brenda,Lopez,hazello2004@gmail.com,,,former-student,38,38
Susana,Manzanares,smanzanares38@yahoo.com,,,alumni,38,38
Kirsten,Morales,kirsten.y.morales@gmail.com,,,alumni,38,38
Tuyet,Pham,cathuong15@yahoo.com,,,alumni,38,38
Anette,Portalatin,annette_m_p@hotmail.com,,,former-student,38,38
Byron,Reyes,byronreyes586@gmail.com,,,alumni,38,38
Zelgai,Sajad,zsajad12@gmail.com,,,former-student,38,38
Soraya,Sek,sorayasadek89.2019@gmail.com,,,alumni,38,38
Kay,Vang,kkaymeos@yahoo.com,,,former-student,38,38
Grisanaldy,Vasquez,grisavc@live.com,,,former-student,38,38
Thomas,Vo,toanvopc@gmail.com,,,former-student,38,38
Manal,Abdeljabbar,manal42000@yahoo.com,,,alumni,37,37
Benafsha,Amri,noorideeda@gmail.com,,,alumni,37,37
Marie,Andre,mandre90@comcast.net,,,former-student,37,37
Wendy,Baker,bakertoliche@gmail.com,,,alumni,37,37
Ines,Castellanos,icangana@gmail.com,,,alumni,37,37
Vanessa,Cruz,vanne.pam@gmail.com,,,former-student,37,37
Homa,Daneshvar,homarealtor@gmail.com,,,alumni,37,37
Mikerson,Fevrier,nosrekim@gmail.com,,,alumni,37,37
Jolanta,Forys,jolaforys@gmail.com,,,alumni,37,37
Julio,Fregoso,jcf_music@yahoo.com,,,alumni,37,37
Miriam,Galvez,mimihz813@gmail.com,,,former-student,37,37
Rosiela,Gaquin Farias,gaquinfarias@gmail.com,,,alumni,37,37
Sandra,Garcia,libresj76@gmail.com,,,former-student,37,37
Victoria,Garcia,houstontx341@gmail.com,,,former-student,37,37
Lissette,Gomez,sassycol09@yahoo.com,,,former-student,37,37
Julia,Hahn,juliabhahn@gmail.com,,,alumni,37,37
Cesar,Hernandez,mrhernandezcesar91@gmail.com,,,former-student,37,37
Sirley,Herrera,lj131606@gmail.com,,,alumni,37,37
Wendy,Lafleur,wendylafleur@gmail.com,,,former-student,37,37
Ker,Lee,lkawm123@gmail.com,,,alumni,37,37
Han,Nguyen,hannguyen09@yahoo.com,,,former-student,37,37
Ahmar,Niazi,amark7887@gmail.com,,,alumni,37,37
Luisa,Rojas,calderonl3@gmx.com,,,former-student,37,37
America,Rojas,arojas44@yahoo.com,,,alumni,37,37
Nathalia,Urdaneta,unathalia53@gmail.com,,,alumni,37,37
Rana,Abusaad,ranaabusaleh@hotmail.com,,,alumni,36,36
Cany,Acosta,tusuertecav@gmail.com,,,former-student,36,36
Nighat,Alam,nak1979@gmail.com,,,former-student,36,36
Yorelis,Alfonso,yorelisalfonso@gmail.com,,,former-student,36,36
Erika,Andrickson-Santiago,erika.andrickson@gmail.com,,,alumni,36,36
Kiana,Andujar,kiana.andujar@gmail.com,,,alumni,36,36
Khalayko,Andwar,marsanwar@gmail.com,,,former-student,36,36
Eliana,Angulo,eliloang@gmail.com,,,alumni,36,36
Priscila,Arruda,arrudapriscila36@gmail.com,,,alumni,36,36
Misbah,Arshad,arshad517@yahoo.com,,,former-student,36,36
Veronica,Benitez,veronicacbenitez@gmail.com,,,alumni,36,36
Kateryna,Bochevar,likenew19@gmail.com,,,alumni,36,36
Astrid,Castro-Cid,cochinitocid@gmail.com,,,alumni,36,36
Mercedes,Cruz Mateo,mercedesjcruz@yahoo.com,,,former-student,36,36
Isaias,Del Rosario,isarodo1807@gmail.com,,,former-student,36,36
María Gabriela,George,gabygeorge.spanish@gmail.com,,,alumni,36,36
Liliam,Gonzalez,lgonzalezrodriguez45@gmail.com,,,alumni,36,36
Katherine,Hale Mauricio,kmauricio90@gmail.com,,,alumni,36,36
Jacqueline,Hernandez,jhernandezcolato@outlook.com,,,former-student,36,36
Isaac,Hernandez,alemanfrancisco14@gmail.com,,,alumni,36,36
Johanne,Jean,jahanne1985@gmail.com,,,alumni,36,36
Mehrdad,Kandelousi,mehrdad.mk44@gmail.com,,,alumni,36,36
Ayesha,Khathakk,khattaka@icloud.com,,,alumni,36,36
Lucero,Knipp,lucero.knipp@gmail.com,,,former-student,36,36
Lupena,Laplante,llupena3@yahoo.com,,,alumni,36,36
Mapy,Lugo,mapy.lugo@yahoo.com,,,alumni,36,36
Leslie,Manajarrez,leslie.manjarrez@gmail.com,,,alumni,36,36
Iyad,Marouf,iyad_marouf@yahoo.com,,,former-student,36,36
Bakr,Marouf,bmarouf98@gmail.com,,,former-student,36,36
Zulfia,Mohammadi,worooojak90@gmail.com,,,alumni,36,36
Trang,Nguyen,trangthuynguyen245@gmail.com,,,former-student,36,36
Maria,Olmos,rosarioolmos@yahoo.com,,,alumni,36,36
Marychantell,Ortiz,marychantell78@gmail.com,,,former-student,36,36
Duyen,Pham,duyenph1998@gmail.com,,,former-student,36,36
Samantha,Rendon,sg121698@gmail.com,,,former-student,36,36
Jonathan,Rivera,europeanbracelets@gmail.com,,,former-student,36,36
Shailin,Rosado,sxrosado@gmail.com,,,former-student,36,36
Tanyi,Rosario,trosario72@gmail.com,,,former-student,36,36
Paulo,Santos,paulo40@live.com,,,former-student,36,36
Ana Paula,Sharma,paulasharma1968@hotmail.com,,,alumni,36,36
Ying,Vang,yingvang43@gmail.com,,,alumni,36,36
Jannette,Vazquez,janitza1976@gmail.com,,,former-student,36,36
Stefanie,Work,stefanieacs90@gmail.com,,,alumni,36,36
Urszula,Zurawicz,ruda472000@yahoo.com,,,alumni,36,36
Habiba,Abdi,habibamuhammud89@gmail.com,,,former-student,34,34
Diana,Acevedo Santiago,dianaacevedo0529@gmail.com,,,alumni,34,34
Roman,Akafate,akafate@gmail.com,,,former-student,34,34
Ahlam,Alghazaly,ahlamalghazaly@gmail.com,,,alumni,34,34
Jared,Arellano,jaredarellano21@yahoo.com,,,former-student,34,34
Angel,Avila,endernacho47@gmail.com,,,former-student,34,34
Jovelyn,Bailiar,jovelynstucki@gmail.com,,,former-student,34,34
Sangita,Banskota,jyoti_banskota@hotmail.com,,,former-student,34,34
Mayra,Betancourt,mayizf@gmail.com,,,alumni,34,34
Nancy,Calix-Velasquez,nancyvv0825@hotmail.com,,,alumni,34,34
Norma,Cervantes-Gonzalez,jr2andy1@hotmail.com,,,former-student,34,34
Yadira,Chavez,yadirac1991@gmail.com,,,former-student,34,34
Jesus,Chavez,chavezjesus383@gmail.com,,,alumni,34,34
Blanca,Chavez,chavezblanca40@gmail.com,,,alumni,34,34
Lillian,Cintron,lil2chispa@yahoo.com,,,alumni,34,34
Kassidy,Davis,kassid.avis1@gmail.com,,,alumni,34,34
Arlett Daniela,Delgado,daniela7delgado@gmail.com,,,alumni,34,34
Maria,Delong,delongsinsicily@gmail.com,,,alumni,34,34
Zainab,Dharsey,zainab.khoyee@gmail.com,,,alumni,34,34
Mohamad,El Dib,uniqueagle20@hotmail.com,,,alumni,34,34
Eva L,Espana,espana1974@hotmail.com,,,alumni,34,34
Eduardo,Flores Garcia,eddflor@gmail.com,,,alumni,34,34
Wanda,Garcia,forwandagarcia@gmail.com,,,alumni,34,34
Shabnam,Gawhari,habanamgawhari@gmail.com,,,former-student,34,34
Katherine,Gomez,ramosgomez907@gmail.com,,,alumni,34,34
Elena,Gomez,ela.n.madison@gmail.com,,,alumni,34,34
Natalia,Gontarczyk,gontarczyknatalia@gmail.com,,,alumni,34,34
Vianca,Grassi,mirellagcueto@gmail.com,,,alumni,34,34
Yan,Guo,yguo789@yahoo.com,,,former-student,34,34
Sandra,Lamas,intuitionsl@yahoo.com,,,former-student,34,34
Angela,Layampa,piccolabella0524@gmail.com,,,alumni,34,34
Judith,Levy,levyudith@gmail.com,,,alumni,34,34
Betty,Lopez,bacevedo46@gmail.com,,,former-student,34,34
Getty Carolina,Lopez,gettycarolina@gmail.com,,,alumni,34,34
Marie,Louis-Jeune,marielaurencejeune@gmail.com,,,alumni,34,34
Yana,Majei-Lopaituc,ianaml2926@gmail.com,,,alumni,34,34
Pedro,Medina,dropenamedi19@gmail.com,,,former-student,34,34
Yoali,Medina Martinez,yoalimartinez1999@gmail.com,,,alumni,34,34
Esperanza,Mendoza,espemendoza13@hotmail.com,,,former-student,34,34
Paloma,Mendoza,pm.am0922@gmail.com,,,alumni,34,34
Armentha,Metellus,armenthametellus@gmail.com,,,alumni,34,34
MaryAnn,Montero,nmccarrillo@yahoo.com,,,former-student,34,34
Rocio,Morales,morales.edith1227@gmail.com,,,alumni,34,34
Hector,Mujica,hectormujica9@gmail.com,,,alumni,34,34
Orsolya,Nagy-Czirok,orsolya.nagyczirok@gmail.com,,,alumni,34,34
Munera,Noori,mustafa.noori1394@gmail.com,,,alumni,34,34
Graciela,Ochoa,ochoagraciela415@gmail.com,,,former-student,34,34
Yubisela,Palacios,palacios.yubisela@gmail.com,,,alumni,34,34
Liliana,Pardo,liliana073@gmail.com,,,alumni,34,34
Olivia,Patricio Michel,via.michel20@gmail.com,,,former-student,34,34
Nadia,Pierre,nadiapierre860@yahoo.com,,,former-student,34,34
Sally,Pierre,salrichipr@gmail.com,,,alumni,34,34
Abdul Rahman,Popalzai,abdulrahman7937692@gmail.com,,,former-student,34,34
Ian,Quinzan,ianquinzan811@gmail.com,,,alumni,34,34
Julianne,Rivera,julierv16@outlook.com,,,former-student,34,34
Brenda,Rivera,bdamaris67@gmail.com,,,alumni,34,34
Mary,Rodriguez,mjrdz92@gmail.com,,,former-student,34,34
Shazia,Shahzad,shaz.shahzad786@gmail.com,,,alumni,34,34
Violette,St Jean,vstjean@yahoo.com,,,former-student,34,34
Wendy,St Laurent,keisystlaurent@hotmail.com,,,former-student,34,34
Nguon,Sunheng,nguonsg@mail.uc.edu,,,alumni,34,34
Bonnie,Tartsah,bonniemarietartsah@gmail.com,,,former-student,34,34
Ana,Terezon,oseguedana@gmail.com,,,alumni,34,34
Iris,Vaccarino,irisvaccarino@icloud.com,,,former-student,34,34
Ivan,Vizcarra,naval1984@outlook.com,,,alumni,34,34
Ethel,Wallery,ethelwallery@gmail.com,,,alumni,34,34
Cynthia,Wilkinson,cynea2010@gmail.com,,,alumni,34,34
Nary,Yim,naryjennifer81@gmail.com,,,alumni,34,34
Khin,Zaw,khinwzaw@gmail.com,,,alumni,34,34
May,,meimura2118@gmail.com,,,alumni,31,31
Canaan,Abellan,canaan.abellan@gmail.com,,,alumni,31,31
Elena,Alicea,coto.elena@gmail.com,,,alumni,31,31
Araceli,Alvarado,aalvarado692@gmail.com,,,former-student,31,31
Sherly,Alvarez,sherlyxoxo5@gmail.com,,,alumni,31,31
Roshan,Ara,roshanburhan@outlook.com,,,former-student,31,31
Harmanjeet Kaur,Brar,harman35@ymail.com,,,alumni,31,31
Israel,Camacho,16camacho11@gmail.com,,,former-student,31,31
Hawa,Camara,eve.camsy@gmail.com,,,alumni,31,31
Liz,Caraveo,lizcaraveo2004@gmail.com,,,former-student,31,31
Aurelia P,Carrillo,carrilloaurelia674@yahoo.com,,,former-student,31,31
Josue,Castillo,josuecastilloromero@gmail.com,,,alumni,31,31
Heriberto,Castillo,eddie11castillo@gmail.com,,,alumni,31,31
Linn L,Chu,linnchu23@gmail.com,,,alumni,31,31
Claudia,Cifuentes,claudia.cifuentes84@gmail.com,,,alumni,31,31
Jessica,Colunga,jessicacolunga@my.unthsc.edu,,,former-student,31,31
Jayna M,Cruz,jaynacruz@hotmail.com,,,former-student,31,31
Katherine,Deckers,katherine.deckers@gmail.com,,,alumni,31,31
Sabine,Destine,marisedestine@yahoo.com,,,former-student,31,31
Nanthini,Doowa,nanthini.d@hotmail.com,,,alumni,31,31
Conrad,Ekellem,conradelad871@yahoo.com,,,former-student,31,31
Despres,Elena,elena_despres@yahoo.com,,,alumni,31,31
Ana,Eyrich,anamariearcila@hotmail.com,,,alumni,31,31
Ivan,Flores,flores15@hotmail.com,,,former-student,31,31
Marilu,Garcia,mibarra1221@gmail.com,,,alumni,31,31
Laura,Garcia,lauravgarciaq@gmail.com,,,alumni,31,31
Araceli,Garcia Madrigal,garccia8119@gmail.com,,,former-student,31,31
Kiara,García Mendoza,kiaramarie052091@gmail.com,,,alumni,31,31
Maria Ines,Giannetti,igiannetti@yahoo.com,,,alumni,31,31
Marisol,Gonzalez,marisolglzv@hotmail.com,,,former-student,31,31
Vanessa,Gonzalez,vmgonzalez1913@yahoo.com,,,alumni,31,31
Ana,Gonzalez Chavez,ak.gonzalezchavez@gmail.com,,,former-student,31,31
Ivy,Guedes de Menezes,ivy_castrolima@hotmail.com,,,alumni,31,31
Assia,Gurunyan,assiagurunyan10@gmail.com,,,alumni,31,31
Valeria,Hernandez,dallasval1111@gmail.com,,,former-student,31,31
Mayte,Herrera,jjontheroad2020@outlook.com,,,former-student,31,31
Titi,Huynh,titi.huynh36@gmail.com,,,former-student,31,31
Abdo,Jarjanazi,abdo-edu@hotmail.com,,,former-student,31,31
Hadil,Kilani,hadil.kilani@gmail.com,,,alumni,31,31
Esryani,Kok,fresr28@yahoo.com,,,alumni,31,31
Jessica,Lacayo Bardales,jesslaclop118@gmail.com,,,alumni,31,31
Emily,Laguna,emilylaguna16@gmail.com,,,former-student,31,31
Brenda,Leon,brendaleon95@yahoo.com,,,former-student,31,31
Michelle,Leva,mfleva9@gmail.com,,,alumni,31,31
Pinxia,Li,pinxia820@gmail.com,,,alumni,31,31
Jesus,Lopez,jjuszero@hotmail.com,,,former-student,31,31
Kaluba,Lupaji,kalubalupaji@gmail.com,,,alumni,31,31
Max,Martinez,maxmartinezp@outlook.com,,,alumni,31,31
Peggy,May,peggycmay@gmail.com,,,former-student,31,31
Alejandra,Medina,ale23medina@gmail.com,,,alumni,31,31
Marianela,Miranda Carhuayo,marianela412@gmail.com,,,alumni,31,31
Jatin,Mistry,jatin56@aol.com,,,former-student,31,31
Ligia,Mooney,ligiac.mooney@gmail.com,,,alumni,31,31
Gerardo,Moreno,gerardodavid1997@hotmail.com,,,alumni,31,31
Suan,Mung,smung1975@gmail.com,,,former-student,31,31
Olatunde,Mustapha,olatundecmustapha@yahoo.com,,,former-student,31,31
Xyomara,Narvaez,xyomaranarvaez6226@gmail.com,,,alumni,31,31
Patricia,Navarrete,navamejia@gmail.com,,,alumni,31,31
Daniela,Navia,solnv85@hotmail.com,,,former-student,31,31
Breann,Nelson,breann.nelson@quickcaresd.com,,,former-student,31,31
Hoa,Nguyen,nth20793@gmail.com,,,former-student,31,31
Tuan,Nguyen,timmytuan75@yahoo.com,,,former-student,31,31
Hao,Nguyen,haonguyen1218@gmail.com,,,alumni,31,31
Mustafa,Nikzad,mnikzad786@yahoo.com,,,former-student,31,31
Glory,Njeck,glorytegwi@gmail.com,,,alumni,31,31
Maria de Los Angeles,Olivares Garcia,maria06garcia13olivares96@gmail.com,,,former-student,31,31
Jason,Park,jasonwkdwkd7@gmail.com,,,alumni,31,31
Iracema,Pell,maestrapell@gmail.com,,,alumni,31,31
Anne Marie,Philippe,annemariephilippe123@yahoo.com,,,former-student,31,31
Ny,Phu,aloha4usa@gmail.com,,,former-student,31,31
Lal,Piang,piangte@gmail.com,,,alumni,31,31
Denise,Polanco,dpolanco019@gmail.com,,,former-student,31,31
Gerardo,Ramirez,mit.ramirez@yahoo.com,,,former-student,31,31
Maria,Ramirez,maria_ramirez14@live.com,,,alumni,31,31
Maria,Ramirez,paularjsc@hotmail.com,,,alumni,31,31
Greysi,Riascos,greysi.riascos96@gmail.com,,,former-student,31,31
Dan,Rinkevich,danrinkevich5@gmail.com,,,alumni,31,31
nadia,Rivera,nadiarnprof@gmail.com,,,alumni,31,31
Maria,Rodriguez,spaniard@gmx.net,,,former-student,31,31
Mary G,Rodriguez,famrod2007@yahoo.com,,,former-student,31,31
Regla,Rodriguez,regla60@hotmail.com,,,alumni,31,31
Anacelia,Rosales,anacelia87@yahoo.com,,,former-student,31,31
Keysa,Sahardid,ksahardid@yahoo.com,,,former-student,31,31
Ruby,Sanchez,sanchez.ruby93@gmail.com,,,alumni,31,31
Lourdes,Santana,lsverokat@hotmail.com,,,alumni,31,31
Miguel Alessandro,Sarmiento,sarmientomiguel908@gmail.com,,,alumni,31,31
Olga,Sass,o.sass@hotmail.com,,,alumni,31,31
Lane,Scott,lanes1848@gmail.com,,,former-student,31,31
Silvette,Sierra,ssierra111@gmail.com,,,alumni,31,31
Isabelita,Solis,isadiaz@live.com,,,alumni,31,31
Cristina,Soto Garza,petetsoto89@gmail.com,,,alumni,31,31
Dominic,Tagler,dtagler12@gmail.com,,,alumni,31,31
Kevin,Thakkar,kevin@interpreteasy.com,,,alumni,31,31
Patricia,Vazquez-Trimpe,patrvas1989@gmail.com,,,alumni,31,31
Diana,Velasquez,dvelasquez71@gmail.com,,,alumni,31,31
Linh,Ward,nntlinda@yahoo.com,,,former-student,31,31
Najibulalh,Wardak,dr_najib2007@yahoo.com,,,alumni,31,31
Maria,Zecchin,mbzecchin@gmail.com,,,alumni,31,31
Zulfia,Abdusalen,sunrise35@live.com,,,former-student,27,27
Edouard,Anderson,anderson1255@gmail.com,,,alumni,27,27
Muhammad,Aslam,maaslamj@gmail.com,,,alumni,27,27
Evelyn,Bernal,evelynbernal115@gmail.com,,,alumni,27,27
Eddie,Billegas,eddoe713@gmail.com,,,alumni,27,27
Tatiana,Bishop,nitaybellito14@outlook.com,,,former-student,27,27
Carlos,Cardona,carlosphantom@gmail.com,,,former-student,27,27
Melissa,Castillo,melissacastillo264@icloud.com,,,alumni,27,27
Veronica,Castro,castro.veronica12@gmail.com,,,alumni,27,27
Carolin,Garcia,carolin-garcia@hotmail.com,,,former-student,27,27
Jusephine,Ghong,ghongjosy@gmail.com,,,alumni,27,27
Angela,Guastaferro,aguas2003@gmail.com,,,alumni,27,27
Javier,Ibanez,escritorwannabe@gmail.com,,,former-student,27,27
Aida,Leatherwood,aida.v.leatherwood@gmail.com,,,former-student,27,27
Aina,Lee,highyah666@yahoo.com,,,former-student,27,27
Jimena,Lopez,jimena051403@gmail.com,,,former-student,27,27
Javiera,Lorenzo,javonaa@gmail.com,,,former-student,27,27
Sebastian,Maloof,sebastianmaloof@gmail.com,,,alumni,27,27
Moussa,Medina,medinamoussa95@yahoo.com,,,alumni,27,27
Laura,Montes,lauramontesr@gmail.com,,,alumni,27,27
Rehana,Rehman,drgr8@hotmail.com,,,alumni,27,27
Heidi,Rodriguez,hrtinterprets@gmail.com,,,alumni,27,27
Karina,Vargas,k-rina0524@hotmail.com,,,former-student,27,27
Julie,Vazquez,julie@teguz.com,,,former-student,27,27
Yenlinh,Vu,yenlinhvu85@gmail.com,,,alumni,27,27
Diana,Whitmore,dwhitmore77.dw@gmail.com,,,alumni,27,27
Zaynab,Abdelwahab,zaynab.mokhtar@gmail.com,,,alumni,26,26
Abdusattar,Aboughuddeh,sattaraboh@gmail.com,,,alumni,26,26
Simental,Ana,anasim2015@gmail.com,,,former-student,26,26
Maria,Argueta,ireneinter77@gmail.com,,,alumni,26,26
Maria,Arroyo,mariaarroyo421@yahoo.com,,,former-student,26,26
Melissa,Ayala,mel_rrjd@yahoo.com,,,alumni,26,26
Luis,Barragan,labsx01@gmail.com,,,former-student,26,26
Ana,Barreiros,anareckb@gmail.com,,,alumni,26,26
Karim,Boudlal,karim_boudlal@yahoo.com,,,alumni,26,26
Yazmin,Caravin,yazcar21@yahoo.com,,,former-student,26,26
Hector,Cardona,hector_cardona_52@yahoo.com,,,former-student,26,26
Karina,Carranza,kloayza6@hotmail.com,,,former-student,26,26
Aurora,Carrero,auroracarrero50@gmail.com,,,alumni,26,26
Yolanda,Castillo,yolandacast@gmail.com,,,alumni,26,26
Tyler,Cebula-Shiver,cyrusslyfox@gmail.com,,,alumni,26,26
Lourdes,Charqueno,lulycharqueno@hotmail.com,,,alumni,26,26
Rosa,Chavez,marlen.chavez@hotmail.com,,,former-student,26,26
Laura,Chavez,laurafchavez1974@yahoo.com,,,alumni,26,26
Sandra,Davidson,panamagirl718.sd@gmail.com,,,alumni,26,26
Susanne,Duke,susanneduke11@gmail.com,,,alumni,26,26
Maria,Fernandez,mariaxxb1130@gmail.com,,,alumni,26,26
Alipio,Filho,alifilho@hotmail.com,,,former-student,26,26
Dinh,Han,dinhhan1404@yahoo.com,,,alumni,26,26
Sen,Hannock,sardiusjudah@yahoo.com,,,alumni,26,26
Husari,Haya,emyousef579@gmail.com,,,former-student,26,26
Marielen,Heras,marielenahc99@gmail.com,,,former-student,26,26
Judith,Hernandez,judithhdz2229@gmail.com,,,former-student,26,26
Jose,Hernandez,jose.arbonne@gmail.com,,,alumni,26,26
Cynthia,Herrera,413cynthia@gmail.com,,,alumni,26,26
Carolina,Holtz,carolinahb@zoominternet.net,,,former-student,26,26
Halina,Howard,halina.howard.2793@gmail.com,,,former-student,26,26
Mohamed,Ismail,mohamedism515@yahoo.com,,,former-student,26,26
Vibol,Kuth,vibolb@gmail.com,,,former-student,26,26
Eyela,Laghaie,elaghaie@gmail.com,,,former-student,26,26
Nicole,Lima,nicolekalima@gmail.com,,,alumni,26,26
Lucerito,Lluilema,luceruiz95@gmail.com,,,alumni,26,26
Janet,Lopez,jlopez012592@gmail.com,,,former-student,26,26
Maria Alejandra,Lopez,hernandezma117@yahoo.com,,,former-student,26,26
Pili,Lopez,mdpili.lopez@gmail.com,,,former-student,26,26
Osvaldo,Lopez,catastrophe657@hotmail.com,,,former-student,26,26
Brendalis,Maria,brendalis35@gmail.com,,,former-student,26,26
Daisy,Mariscal,daisymar21@gmail.com,,,alumni,26,26
Lucia,Martinez,luciazoeml@yahoo.com,,,alumni,26,26
Elba,Melendez,elbam.melendez@gmail.com,,,alumni,26,26
Sarmad,Memon,sarmadshams30@gmail.com,,,former-student,26,26
Maria,Miller,maria.miller2121@gmail.com,,,alumni,26,26
Flor,Miranda,flormiranda74@yahoo.com,,,alumni,26,26
Jenifer,Montero,jenifermontero@sbcglobal.net,,,alumni,26,26
Anh,Nguyen,utbipsg@gmail.com,,,former-student,26,26
Quynh,Nguyen,ngocngo100@yahoo.com,,,alumni,26,26
Ernesto,Nunez,enunez0102@gmail.com,,,former-student,26,26
Robert,Palma,r_palma77@yahoo.com,,,former-student,26,26
Htoo,Paw,htpaw38@gmail.com,,,alumni,26,26
PERLA,PEREZ,pperez1248@gmail.com,,,alumni,26,26
Cesar,Quintana,cesarquintana79@yahoo.com,,,former-student,26,26
Josseline,Rodas,jarodas_18@hotmail.com,,,alumni,26,26
Rebeca,Rosario,skytower1002002@yahoo.com,,,former-student,26,26
Taghreed,Saleh,taghreedsaleh5@gmail.com,,,alumni,26,26
Maritza,Salmeron,maritzasalmeron19@gmail.com,,,alumni,26,26
Fabiola,Sanchez,sanchez.fabiola@gmail.com,,,alumni,26,26
Edom,Sebsebie,edomsebsebie@gmail.com,,,former-student,26,26
Nahla,Shalan,docshalan@gmail.com,,,alumni,26,26
Carla,Soares,csoares2242@gmail.com,,,alumni,26,26
Ammy,Solis,aasolis_11@hotmail.com,,,former-student,26,26
Maria,Sosa,sosamaritere4@gmail.com,,,alumni,26,26
Sutapa,Svetamani,sutapa.svetamani@gmail.com,,,alumni,26,26
Lachyngul,Taganova,lachina85taganova@gmail.com,,,alumni,26,26
Jahsmyn,Talhami,alejandratg77@gmail.com,,,alumni,26,26
Kuzanova,Tamara,tamara.kuzanova@gmail.com,,,alumni,26,26
Chanthy,Tan,tanchanthy@gmail.com,,,alumni,26,26
Elza,Torres,etsosa@live.com,,,former-student,26,26
Andy,Truong,austin072005@yahoo.com,,,former-student,26,26
Phinzo,Tuladhar,phinzot@gmail.com,,,alumni,26,26
Luis,Vasquez,luisv5010@gmail.com,,,alumni,26,26
Omer,Waheed,omerwaheed2006@gmail.com,,,alumni,26,26
Asma,,amuth6@uic.edu,,Languages: Arabic,former-student,22,22
Kheera,,khiltonmcvane@gmail.com,,,former-student,22,22
Sevcinj,Abdullayeva,sabdullaeva@gmail.com,,,alumni,22,22
Omnia,Ahmed,omniamorsi@gmail.com,,Languages: Arabic,alumni,22,22
Daniela,Alayon,danielamroger@gmail.com,,,alumni,22,22
Vanessa,Andrade,tandravzla83@gmail.com,,Languages: -,alumni,22,22
Elisa,Arredondo,fressaarredondo13@gmail.com,,Languages: Spanish,alumni,22,22
Josefina,Arredondo,josefinaarredondo25@yahoo.com,,Languages: Spanish,alumni,22,22
Jorge,Avalos,mandoojeda8322@outlook.com,,Languages: Spanish,former-student,22,22
Emma,Azpeitia,esazpeitia@gmail.com,,Languages: -,former-student,22,22
Sara,Barbosa,saraof1993@yahoo.com,,,former-student,22,22
Karla,Benitez,karlabenitez85@yahoo.com,,Languages: Spanish,former-student,22,22
Carolina,Bodiford,carolabodiford@yahoo.com,,Languages: Spanish,alumni,22,22
Soumia,Bousofa,sbousofa@hotmail.com,,Languages: -,alumni,22,22
Natalie,Chavarria,natalie.chavarria@uabc.edu.mx,,Languages: -,former-student,22,22
Jorge,Chourio Barreto,jorgeemilioxyz@gmail.com,,Languages: Spanish,former-student,22,22
Leslie,Contreras,lesliec730@gmail.com,,Languages: Spanish,alumni,22,22
Vanessa,Cuadrado,vane.17a.k@gmail.com,,Languages: Spanish,former-student,22,22
Monica,De la Pava,mdelapava1@gmail.com,,Languages: SPANISH,alumni,22,22
Carlos,Debrito,cuiabrito@gmail.com,,Languages: Portuguese,alumni,22,22
Haddish,Desta,haddish1954@gmail.com,,Languages: Amharic Tigrinya,former-student,22,22
Daisy,Diaz,ramos.dgo@gmail.com,,Languages: Spanish,former-student,22,22
Maria Claudia,Dominguez Millan,dominguez1217@yahoo.com,,Languages: -,former-student,22,22
Iryna,Dunets,dunrapishi@gmail.com,,,alumni,22,22
Amal,Farouk,amalf0036@gmail.com,,Languages: -,alumni,22,22
Aiman,Fatima,aimanfatima2566@gmail.com,,Languages: -,alumni,22,22
Awilda,Feal,fealawilda@gmail.com,,,alumni,22,22
Idaliz,Figueroa,figueroai682@gmail.com,,,former-student,22,22
Juliana,Garcia,cinnamon_g20@yahoo.com,,Languages: Spanish,former-student,22,22
Sucreily,Garcia,figuereosucreily@outlook.com,,Languages: Spanish,former-student,22,22
Walaa,Gassim,walagasim@yahoo.com,,Languages: Arabic,alumni,22,22
Vicky,Gomez,vickysabelgg@hotmail.es,,Languages: -,former-student,22,22
Luz,Gutierrez,lucyguti1986@gmail.com,,Languages: Spanish,former-student,22,22
Frances,Guzman,francesgm86@gmail.com,,Languages: Spanish,alumni,22,22
Jesus,Hernandez,jesus.hernandez256@outlook.com,,Languages: Spanish,former-student,22,22
Anabel,Hernandez,anabel1034@icloud.com,,Languages: Spanish,former-student,22,22
Mariela,Hernandez Mellado,marielahernandez007@gmail.com,,Languages: Spanish,alumni,22,22
Michael,Ibharebhor,holluberry@gmail.com,,"Languages: Yoruba, Pidgin English",alumni,22,22
Sori,Javier,sorimjavier@gmail.com,,Languages: Spanish,alumni,22,22
Brixzel,Juan Herrera Cortez,diamondzcortez1@gmail.com,,,former-student,22,22
Lubo,Kerorsa,luboteferi@gmail.com,,Languages: Amharic & Orobo,alumni,22,22
Suleman,Khan,sulemankhankaawish700@gmail.com,,Languages: Kaawish,former-student,22,22
Rihab,Kouba,koubarihab@gmail.com,,Languages: Arabic and French,alumni,22,22
Ky,Le,adrianle64@gmail.com,,Languages: Vietnamese,alumni,22,22
Arlyn,Lujan Orona,arlenelujan97@yahoo.com,,,former-student,22,22
Janai,Luna,janailunaaa@icloud.com,,Languages: -,former-student,22,22
Emma,Lyron,emmayglyron@gmail.com,,,alumni,22,22
Cynthia,Magaña,cynthiamagana00@gmail.com,,Languages: Spanish,alumni,22,22
Adelajda,Malaj,adelajda_malaj@yahoo.com,,"Languages: Albanian, Italian, Spanish",former-student,22,22
Ana Claudia,Marinho,ana.marinho7@hotmail.com,,Languages: Portuguese,alumni,22,22
Rae Ann,Martin,puravida038@gmail.com,,,former-student,22,22
Flavia,Melo,flavia.castrom@hotmail.com,,,former-student,22,22
Shantal,Mendez,smendez.bg@gmail.com,,Languages: Spanish,alumni,22,22
Tanesha,Mondestin,mondestin.tanesha@gmail.com,,Languages: Haitian Creole,alumni,22,22
Brenda,Morales,morales.b25@gmail.com,,Languages: Spanish,former-student,22,22
Mariya,Moskalenko,m.moskalenko@aol.com,,Languages: Russian,former-student,22,22
Ally,Nguyen,allynguyen19@yahoo.com,,Languages: Vietnamese,alumni,22,22
Dim,Niang,dzniang@southern.edu,,Languages: Tedim Chin Burmese,former-student,22,22
Margot,Ocampo Lopez,marocampol@gmail.com,,Languages: -,former-student,22,22
Graciela,Ochoa,ochoagraciela@ymail.com,,Languages: Spanish,former-student,22,22
Luana,Olivieri,luana.olivieriwhittle@gmail.com,,Languages: French,alumni,22,22
Valentina,Orduna,vorduna81@gmail.com,,Languages: Spanish,alumni,22,22
Devika,Patel,devikapatel878@gmail.com,,"Languages: GUJRATI,HINDI",former-student,22,22
Evelyn,Perez Paiz,evelyn.paiz@yahoo.com,,Languages: -,alumni,22,22
Laura,Prendez,lauraprendez@hotmail.com,,Languages: -,former-student,22,22
Marcia,Radetich,radetichmar@hotmail.com,,Languages: -,alumni,22,22
Cynthia,Rendon Cortes,cynthia02rendon@gmail.com,,Languages: Spanish,alumni,22,22
Adelaide,Richardson,jetdolly@yahoo.com,,Languages: Portuguese,former-student,22,22
Diego,Riveiro,diegorido@gmail.com,,Languages: Portuguese,alumni,22,22
Angelica,Rivera,a_rivera_07@yahoo.com,,,alumni,22,22
Laura,Rojas,laurarojas9627@gmail.com,,Languages: -,alumni,22,22
Gabriel,Roman,gabriel-roman@hotmail.com,,Languages: Spanish,former-student,22,22
Youghourta,Saidoun,jugusaidoun@yahoo.com,,,former-student,22,22
Scarlett,Salvador,scarsizzles@gmail.com,,,former-student,22,22
Yorian,Santiago,yoriansantiago@gmail.com,,Languages: -,former-student,22,22
Pabla,Schielm,pablaschliem@gmail.com,,Languages: Spanish,alumni,22,22
Deborah,Silva,debsilsan@icloud.com,,Languages: Brazilian Portuguese,alumni,22,22
Andrea,Singleton,afmsingleton@gmail.com,,,former-student,22,22
Tanya,Subia,thannya7@yahoo.com,,Languages: Spanish,former-student,22,22
Norma,Tafolla,tafolla_norma@yahoo.com,,Languages: Spanish,alumni,22,22
Debora,Tatum,debs_fortal@yahoo.com,,Languages: Brazilian Portuguese,former-student,22,22
Liliana,Torres,lilianat818@gmail.com,,Languages: Spanish,former-student,22,22
Perla,Tronco-Lopez,perla.troncol@gmail.com,,Languages: Spanish,alumni,22,22
Bernice,Vazquez,bernicevasquez@gmail.com,,Languages: Spanish,former-student,22,22
Katerine,Wertman,kgrwertman@gmail.com,,Languages: Spanish,alumni,22,22
Luis,Zambrano,lzambrano3790@outlook.com,,Languages: Spanish,former-student,22,22
Robert,Zambrano,rozambrano15@gmail.com,,Languages: -,alumni,22,22
Johanna,Zarate,johannazarate243@yahoo.com,,,former-student,22,22
LaloBabo,,contact@aalb.org,,,alumni,,
Iris,,thatdoesntexist@gmail.com,,,alumni,,
Thomas,(Toan) Vo,sitoan_mytho2002@yahoo.com,,,alumni,,
Marco,A Zanabria,perete2050@gmail.com,,,alumni,,
Cristina,A. Garcia,cristinaag03@gmail.com,,,alumni,,
Sergio,A. Godínez,noisyserge@gmail.com,,,alumni,,
Mayra,A. Miranda,miranda.mm2@gmail.com,,,alumni,,
ISABEL,A. ZABALA MORETA,isabelzm001@gmail.com,,,alumni,,
Samir,Abdullah,sam.abd.2020@gmail.com,,,alumni,,
Sthefany,Adames,sthefadames1216@gmail.com,,,alumni,,
Maryamo,Adan,maryama.adan2024@gmail.com,,,alumni,,
Mario,Adán Gutiérrez Zamudio,mario.guza15@gmail.com,,,alumni,,
Eneida,Agosto,eneida128@gmail.com,,,alumni,,
Kátia,Aguiar,kkamosso@gmail.com,,,alumni,,
Markeljada,Ahmetlli,markeljadaahmetlli@gmail.com,,,alumni,,
Mahammad,Ajaj Ansari,ansarimahammad0816@gmail.com,,,alumni,,
Pinar,Akca,pinarxoxo2@gmail.com,,,alumni,,
Arizbeth,Alarcon,arizbeth.sandoval@gmail.com,,,alumni,,
Zaday,Alayo De La Fe,sitiyzaday51@gmail.com,,,alumni,,
Jose,Alberto Cubias-Bonilla,albertocubiasbonilla@gmail.com,,,alumni,,
César,Alberto Pérez Cedeño,phslife7@gmail.com,,,alumni,,
Esteban,Alberto Suarez Ramirez,estebans.2809@gmail.com,,,alumni,,
Karina,Alexander,karinaalexander01@gmail.com,,,alumni,,
Maria,Alicia Lima,alicecornerbshop@gmail.com,,,alumni,,
Rosa,Alicia Lopez,llgemini2@gmail.com,,,alumni,,
Mays,Alshaikhsalama,2il7ayat@gmail.com,,,alumni,,
Futoon,Alsurakhi,alsurakhifutoon@gmail.com,,,alumni,,
Rebecca,Alvarenga,rlaa0801@gmail.com,,,alumni,,
Jonathan,Alvarez,jalv07583@gmail.com,,,alumni,,
Maria,Ana Lopez,lopez150.ml@gmail.com,,,alumni,,
Nelly,Angelina Roman Gullings,angelina.roman23@gmail.com,,,alumni,,
David,Anguiano,daveangrang@gmail.com,,,alumni,,
Araceli,Ann Brown,virgo69sb@gmail.com,,,alumni,,
Rae,Ann Martin,rmartin77@me.com,,,alumni,,
Roshan,Ara,zakamin.ara@gmail.com,,,alumni,,
Bryant,Aracena,aracenabryant@gmail.com,,,alumni,,
Quetzaly,Arellano,quetzalyarellano06@gmail.com,,,alumni,,
Helen,Arevalo,harevalo61@gmail.com,,,alumni,,
Gladys,Arias-Marin,gladysarias274@gmail.com,,,alumni,,
Jorge,Armando Avalos Ojeda,jorge.a.avalos123@gmail.com,,,alumni,,
Daisy,Arroyo Pacheco,daisypacheco17@gmail.com,,,alumni,,
Misbah,Arshad,misbaharshad517@gmail.com,,,alumni,,
Adela,Arzola,adelae15@gmail.com,,,alumni,,
Mohammadjavad,Askari,johnny10ar@gmail.com,,,alumni,,
Ahmed,Atef Ahmed S Zaghloul,alpha@aalb.org,,,alumni,,
Isabelita,Aurora Gonzalez,gonzalezisabelita714@gmail.com,,,alumni,,
Shireen,Awwad,awwadshireen8@gmail.com,,,alumni,,
Lelia,B Avalos,lelia14@hotmail.com,,,alumni,,
Adriana,B. Gil,the.gils.tampa@gmail.com,,,alumni,,
Rosa,B. Hernandez,rosahernandez4571@gmail.com,,,alumni,,
Sangita,Banskota,banskotasangita2@gmail.com,,,alumni,,
Kadiatu,Barrie,kadi031023@gmail.com,,,alumni,,
Winter,Batista,scooby-jina4@hotmail.com,,,alumni,,
Carmen,Bazzi,carmen13bazzi@gmail.com,,,alumni,,
Jennifer,Beatriz Ruiz,jenfb67@gmail.com,,,alumni,,
Mayra,Belasquez,mayrabelasquez@gmail.com,,,alumni,,
Jovenise,Benjamin,jovenisebenjamin@gmail.com,,,alumni,,
Iuliia,Bezara Zhuk,j6983592@gmail.com,,,alumni,,
Genesys,Bianca Trujillo,genesysbtrujillo@gmail.com,,,alumni,,
Alix,Bolanos-Gomez,alixcgomez@gmail.com,,,alumni,,
Azzedine,Boumeraou,azzedine06boumeraou@gmail.com,,,alumni,,
Nelson,Brauchitsch,nbrauchitsch@gmail.com,,,alumni,,
Allen,Brian Picoc,allenbrianp@gmail.com,,,alumni,,
Emily,Bruns,contact12@aalb.org,,,alumni,,
Andrew,Bullock,andrew.inter.sg@gmail.com,,,alumni,,
Claudia,C. Aguirre Subauste,holdontome.mc@gmail.com,,,alumni,,
Emily,Cabrera,emilygabriela1@live.com,,,alumni,,
Leslie,Calderon,kaligoddess2013@gmail.com,,,alumni,,
Josue,Campos,jocccg2@gmail.com,,,alumni,,
Ivonne,Cano Rodriguez,ivonnecr90@gmail.com,,,alumni,,
Yazmin,Caravarin,morales102014@gmail.com,,,alumni,,
Christopher,Cardona,cicardona76@gmail.com,,,alumni,,
Christopher,Cardoso,19chriscardoso96@gmail.com,,,alumni,,
Jean,Carlos Vizcarrondo Salgado,vizcarrondojean@gmail.com,,,alumni,,
Flavia,Carolina Castro Melo,flaviagelan@gmail.com,,,alumni,,
Karina,Carranza,kloayza6@gmail.com,,,alumni,,
Aurelia,Carrillo Perez,aureliagto674@gmail.com,,,alumni,,
Mariela,Ceballos,ariegold.2@att.net,,,alumni,,
Gabriella,Cecilia Arias Linares,gabriella.arias17@gmail.com,,,alumni,,
Elfrida,Cerrato,elfriye@yahoo.com,,,alumni,,
Marisol,Cervantes Suarez,maryshood@icloud.com,,,alumni,,
Norma,Cervantes-Gonzalez,jr2andy1@gmail.com,,,alumni,,
Panam,Chaiyaporn,panamforworks@gmail.com,,,alumni,,
Dounia,Chakrane,ahmed_ny@live.com,,,alumni,,
FuYongLi,Chambers,fylchambers@gmail.com,,,alumni,,
Irene,Chavez Garcia,chavezirene19@yahoo.com,,,alumni,,
Ana,Chavez-Boj,chavezboj0522@gmail.com,,,alumni,,
Katherine,Chunchi,katherinechunchi@outlook.com,,,alumni,,
Alípio,Clarence Filho,alifilho1909@gmail.com,,,alumni,,
maria,claudia dominguez guillen,mariadominguezguillen1985@gmail.com,,,alumni,,
Jessica,Colunga,yezzkolumba@gmail.com,,,alumni,,
Maciel,Contreras,macielm10@gmail.com,,,alumni,,
Gisella,Craig,brokergcraig@gmail.com,,,alumni,,
Maria,Cristina Iordan,cristinaiordanco@gmail.com,,,alumni,,
Grecia,Cruz,grecia.cruz.rdz@gmail.com,,,alumni,,
Abigail,Cruz Castillo,buffoneabigail@gmail.com,,,alumni,,
Mercedes,Cruz Mateo,mercedesjcruz16@gmail.com,,,alumni,,
ANDY,CUONG TRUONG,austin072005@gmail.com,,,alumni,,
Jonathan,D. Rivera,dailydocuments123@gmail.com,,,alumni,,
Charlemagne,Dafney M. L.,neydly18@gmail.com,,,alumni,,
Joel,Daniel Rosario U.,joelrosario9898@gmail.com,,,alumni,,
Aisha,Daoud,aishasoliman782@gmail.com,,,alumni,,
Jose,David Ortega Carcano,greenfrog1075@gmail.com,,,alumni,,
Maryna,Daw,marynadaw@gmail.com,,,alumni,,
Jaquelane,de Oliveira Pio,lualany@hotmail.com,,,alumni,,
Madina,Dedakhanova,madinabreece@gmail.com,,,alumni,,
Maria,del Pilar English,pdiaz3244@gmail.com,,,alumni,,
Maria,Del Pilar Lopez-Saavedra,ojosmagnificos@gmail.com,,,alumni,,
Maristella,Delgado Jimenez,maristelladj91@hotmail.com,,,alumni,,
Graciela,Diaz,gracie4805@gmail.com,,,alumni,,
Graciela,DiazI,gracie4805@gmai.com,,,alumni,,
Monica,Diez,monicadiez.16@gmail.com,,,alumni,,
Honora,Divine Wache,ataraxiavie@gmail.com,,,alumni,,
Anh,Do,atdo088@gmail.com,,,alumni,,
Natasha,Doherty,natashadoherty53@yahoo.com,,,alumni,,
Denise,Dominguez,deniisejd@gmail.com,,,alumni,,
IAN,DONES RIVERA,pepinianopr@gmail.com,,,alumni,,
Ngoc,Duy Doan,duyhohap@gmail.com,,,alumni,,
Yuliana,Dzhus,julianadzhus@gmail.com,,,alumni,,
Megan,E Aguilar Tenorio,meganaguilar428@gmail.com,,,alumni,,
Zimri,E Díaz,zimri946@gmail.com,,,alumni,,
Sebastian,E Girado,sebassgirado@gmail.com,,,alumni,,
Irma,E Ramos,irma.elizabethramos@gmail.com,,,alumni,,
Doria,E. Diaz Ibarra,doriaestherdiaz1@gmail.com,,,alumni,,
Erendira,E. Garcia Guzman,elviracitas@gmail.com,,,alumni,,
Julianne,E. Rivera Rodríguez,julianne.rivera2@gmail.com,,,alumni,,
Andres,E. Wallace,andres@aalb.org,,,alumni,,
Brenda,Edith Cuellar,brenda.cuellar3@gmail.com,,,alumni,,
Marc,Edson Augustin,medsonaugustin@gmail.com,,,alumni,,
Cesar,Eduardo Hernandez Morales,cemore91@yahoo.com,,,alumni,,
Isra,El Azma,sarsareno2005@gmail.com,,,alumni,,
Maria,Elena Dobbins,marielsainz@gmail.com,,,alumni,,
Kerson,Elidor,elidorkerson@yahoo.fr,,,alumni,,
Jhadai,Elizenda Domingo Casanova,jhadaidc@gmail.com,,,alumni,,
Aslyn,Emely Ochoa Cruz,emely1040@gmail.com,,,alumni,,
Jean,Emmanuel Fouche,fouchemman@gmail.com,,,alumni,,
Pierre,Enock Charles,pierrecharles3333@gmail.com,,,alumni,,
Evelio,Enrique Roque,lectorc7@gmail.com,,,alumni,,
Kyle,Eshom,eshom.kyle@gmail.com,,,alumni,,
Jessica,Espinoza,jessyvette998@gmail.com,,,alumni,,
Veronica,Espinoza,veronica.espinoza042@gmail.com,,,alumni,,
Julissa,F Olivas,fernandaolivas26@gmail.com,,,alumni,,
Luis,F Zambrano,thegeekfortress00@gmail.com,,,alumni,,
Gabriela,Falcão Costa dos Santos,gabifalcaoc@gmail.com,,,alumni,,
Paula,Favaretto,ailtonbia06@hotmail.com,,,alumni,,
Emmanuel,Fefe,nolimitinterpretingservices@gmail.com,,,alumni,,
Maria,Fernanda Figueroa Rodriguez,mffr1108@gmail.com,,,alumni,,
Maria,Fernanda Mosso,mossmarifer@gmail.com,,,alumni,,
Samantha,Fernandez Ibarra,samanthafernandez165616@gmail.com,,,alumni,,
Irina,Fleming,iultinka1976@gmail.com,,,alumni,,
Marlen,Flores,flores.marlen06@gmail.com,,,alumni,,
Sonia,Flores-Khan,spanishtutorinterpreter13@gmail.com,,,alumni,,
Imma,Frandeline Vedrine,imma.vedrine@gmail.com,,,alumni,,
Franya,Fuentes McDonnell,franyacozari@gmail.com,,,alumni,,
Marie,G Andre,jolieminouche@gmail.com,,,alumni,,
Williana,G Riechi,lilyriechi@yahoo.com,,,alumni,,
Esmeralda,G. Fernandez,pitafernandez1@yahoo.com,,,alumni,,
Hachemy,Gabriel,hachemygab620@gmail.com,,,alumni,,
Evelyn,Galarza,evelyn_galarza@yahoo.com,,,alumni,,
Ashley,Gallardo,gallardoashley58@gmaill.com,,,alumni,,
Josefa,Garcia,jofigar62@gmail.com,,,alumni,,
Adrian,Garcia,adriangarciavaldess@gmail.com,,,alumni,,
Jennifer,Garcia Castaneda,garciajennifer0327@gmail.com,,,alumni,,
Araceli,Garcia Madrigal,agarccia8119@gmail.com,,,alumni,,
Yair,Garcia Sanavia,sanaviayair@gmail.com,,,alumni,,
Shabnam,Gawhari,shabanamgawhari@gmail.com,,,alumni,,
Abigail,Gedsemani Garcia Solis,asolis19besxs@gmail.com,,,alumni,,
Abby,Giambattista,abbygiambi@gmail.com,,,alumni,,
Aisha,Giselle Cayetano,g.sellecayetano@gmail.com,,,alumni,,
Mayra,Gomez,mayrangonez1521@gmail.com,,,alumni,,
Fabiana,Goncalves dos Santos Sarff,fabianagsantos1@gmail.com,,,alumni,,
Laura,Gonzalez Gomez,laurag070264@gmail.com,,,alumni,,
CYNTHIA,GONZALEZ PEREZ,cynthia.glez.pz10@gmail.com,,,alumni,,
Marisol,Gonzalez Villarreal,marisolglzv@gmail.com,,,alumni,,
Gaby,Granados-Garcia,gaby.granados22@gmail.com,,,alumni,,
Jackelin,Greta Santander Herrera,jackelin.santander@gmail.com,,,alumni,,
Maria,Guadalupe Hernandez,mmcleaning22@gmail.com,,,alumni,,
Andrea,Guadalupe Lopez Gonzalez,alopezg448@gmail.com,,,alumni,,
Daniela,Guadalupe Rosales Florencio,daniela.rosales986@gmail.com,,,alumni,,
Cynthia,Gudino,cynthiaguido@yahoo.com,,,alumni,,
Liza,Guerrero,lizzie.617@hotmail.com,,,alumni,,
Yan,Guo,yguo789@gmail.com,,,alumni,,
Liliana,Gutierrez,lilygutierrezc16@gmail.com,,,alumni,,
Walter,H Cifuentes,zeuswlly27@gmail.com,,,alumni,,
Minhchau,H. Nguyen,caithlynnng@gmail.com,,,alumni,,
Zeinab,H. Zaiter,zeezaiter@gmail.com,,,alumni,,
Sonbol,Haghshenas Kashani,sonbolkashani@gmail.con,,,alumni,,
Giovanna,Heanue,giovannaheanue@gmail.com,,,alumni,,
Gihan,Helmy,gigikh260@gmail.com,,,alumni,,
Marielen,Heras,marielenherass@gmail.com,,,alumni,,
Maria,Hernandez,mariaconcep196@gmail.com,,,alumni,,
Jacqueline,Hernandez Colato,jackyyhernandezz@gmail.com,,,alumni,,
Cristina,Hernandez Magaña,cristina.magana.7@gmail.com,,,alumni,,
Elvia,Hinz,hinzelvia@gmail.com,,,alumni,,
Thuba,Hoang,thubalh@hotmail.com,,,alumni,,
Xuan,Hoang Anh Nguyen,nguyenxuanhoanganh73@gmail.com,,,alumni,,
Yezenia,Huaman-Flores,y.zhuaman@gmail.com,,,alumni,,
Israa,Humphries-Arabic,israa.noorhump@gmail.com,,,alumni,,
Helene,Huynh,bhelhuynh13251@gmail.com,,,alumni,,
Jose,I Mejia,joseciito21@gmail.com,,,alumni,,
Cecilia,I. Barnett,ivonnygo@gmail.com,,,alumni,,
Tural,Ibrahimov,ibratural@gmail.com,,,alumni,,
Melissa,Irene Abouelenain Ancira,melly_kan@yahoo.com,,,alumni,,
María,Irene Moyna,mariairenemoyna@gmail.com,,,alumni,,
Korina,Isabel Aguirre,korinaguirre8@gmail.com,,,alumni,,
Tatiana,Isabel Bishop,webtalkenglish@gmail.com,,,alumni,,
Dora,Isela Ocon,doraocon2234@gmail.com,,,alumni,,
Haleemah,Jackson,haleemahj.med@gmail.com,,,alumni,,
Lua,Jamison,lua.jamison@gmail.com,,,alumni,,
Joyce,Janca-Aji,jjanca@coe.edu,,,alumni,,
Daisy,Janett Diaz,daisydiaz608@gmail.com,,,alumni,,
Christopher,Javier Medina,chris.24.medina@icloud.com,,,alumni,,
Jisoo,Jeong,jeong.jisoo0@gmail.com,,,alumni,,
Price,Jeremie,price.jeremie15@gmail.com,,,alumni,,
Jose,Jesus Fuentes Loya,mokeysharkright@gmail.com,,,alumni,,
Paulina,Joanna Wlodzimirow,pauliwlo@gmail.com,,,alumni,,
Shu,Ju Reed,juliareed2011@gmail.com,,,alumni,,
Britney,Juarez- Antonio,britneyjuarez.1@icloud.com,,,alumni,,
Andrea,K. Huff,andreahuff1973@gmail.com,,,alumni,,
Nelia,Karina Rodriguez,nkrodriguez33@gmail.com,,,alumni,,
Mary,Katherine Hartigan,mkhartigan4@gmail.com,,,alumni,,
Lusine,Keshishian,ayolucy@yahoo.com,,,alumni,,
Arouj,Khaliq,aroujnadeem786@gmail.com,,,alumni,,
Osama,Khan,dafiyah.ls16@gmail.com,,,alumni,,
David,Kim,davidkiminterpreter@gmail.com,,,alumni,,
Zuly,Kimball,zarroyoc@gmail.com,,,alumni,,
Erika,Knodler,erikaknodler1@gmail.com,,,alumni,,
Tetenyo,Kodah,tkodah@gmail.com,,,alumni,,
Siew,Kuan Lew,carikerja228@gmail.com,,,alumni,,
Mang,Kung,mangkung2024@gmail.com,,,alumni,,
Maria,L Alcauter,malcauter72@gmail.com,,,alumni,,
Jordan,L Anderson,jordan.anderson2011@gmail.com,,,alumni,,
lizbeth,l castro,liz91castro@gmail.com,,,alumni,,
Suellen,L. Da Cruz,suellendacruz96@gmail.com,,,alumni,,
Paula,L. Guerrero,paulalguerrero1@gmail.com,,,alumni,,
Carolina,L. Holtz,carolina.mundo.cb@gmail.com,,,alumni,,
Arnib,Labib,labibarnib@gmail.com,,,alumni,,
Iris,Laffitte,iris.rrpp@gmail.com,,,alumni,,
Sandra,Lamas,lamassandra09@gmail.com,,,alumni,,
Pamela,Lara Aguillon,pamela93lara@gmail.com,,,alumni,,
Amy,LaTrice Southerland,a1978s1@live.com,,,alumni,,
Sonia,Lawrence,soniapa0790@gmail.com,,,alumni,,
Leila,Leao Ciriaco Fae,leilafae@gmail.com,,,alumni,,
Aina,Lee,juyin72415@gmail.com,,,alumni,,
Rebecca,Lee Ritchey,beccalee0509@gmail.com,,,alumni,,
Gene,Leocadio Soledad,genesoledad43@gmail.com,,,alumni,,
Gladis,Leon,gladisleon82@gmail.com,,,alumni,,
Odile,Leonor Hidalgo,olhgraphicdesigner@gmail.com,,,alumni,,
Anastasiya,Lesyuk,anastasia.lesyuk2015@gmail.com,,,alumni,,
Rosalba,Leticia Alvarado-Giles,rosalbit@gmail.com,,,alumni,,
Nereyda,Liceaga,nereydaliceaga9@gmail.com,,,alumni,,
Aura,Lila Reid,auralilaguadamuz@gmail.com,,,alumni,,
Claudia,Liliana Martinez Herrera,colombia26clm@gmail.com,,,alumni,,
Greysi,Liliana Riascos Urrea,greysir.riascos96@gmail.com,,,alumni,,
Mariana,Lopes Soares Llamas,mariana252000@gmail.com,,,alumni,,
Mayra,Lopez,mlopez439@gmail.com,,,alumni,,
Luisa,Lopez,llopezsandiego@icloud.com,,,alumni,,
Leslie,Lopez M.,lesliemorillo1966@gmail.com,,,alumni,,
Daisy,Lopez-Bryant,lopezd99@gmail.com,,,alumni,,
Kris,Low,krislowspanishinterp@gmail.com,,,alumni,,
Raquel,Lucena,raquel.lucena@gmail.com,,,alumni,,
Dayana,Lucia Mendieta Gutierrez,lulumendieta26@gmail.com,,,alumni,,
Tram,Luu,tramluu0202@gmail.com,,,alumni,,
Erdenechimeg,Luushaan,luushaanerdenechimeg@gmail.com,,,alumni,,
Katrina,Lynn Stubbs,katrinastubbs2727@gmail.com,,,alumni,,
Atalia,López,2001atalialopez@gmail.com,,,alumni,,
Gillian,M Brink León,gigileon.us.98@gmail.com,,,alumni,,
Pamela,M Cortes Rocha,pame2100@gmail.com,,,alumni,,
Leishka,M Cruz Perez,leic17571@gmail.com,,,alumni,,
Griselda,M Hernandez Arellano,gher7441@gmail.com,,,alumni,,
Salvador,M Perez,sal2199@icloud.com,,,alumni,,
Heimantie,M Rodriguez,hbustaa@yahoo.com,,,alumni,,
Rosa,M Taveras,respinal5223@gmail.com,,,alumni,,
Hilda,M. Basora,hilda.basora@gmail.com,,,alumni,,
Walter,M. Gorena,walter.gorena74@gmail.com,,,alumni,,
Gina,M. Liggett,gml7kt@gmail.com,,,alumni,,
Laura,M. Rodriguez,laurastthom@gmail.com,,,alumni,,
FELISHA,M. ROMAN MUNIZ,femaromu@gmail.com,,,alumni,,
Sabrina,M. Serrano,sabcas13@gmail.com,,,alumni,,
Lydia,M. Vega,lyly2383@gmail.com,,,alumni,,
Johanna,M. Zarate,jmzjoc@yahoo.com,,,alumni,,
Leyla,Maharramova,leylahassanova85@gmail.com,,,alumni,,
Fedra,Mahramas,fedramahramas71@gmail.com,,,alumni,,
Jennifer,Mai,mai.jennifer2014@gmail.com,,,alumni,,
Adelajda,Malaj Borici,adelina11121995@gmail.com,,,alumni,,
Luz,Maria Garcia,luzr85@gmail.com,,,alumni,,
Graciela,Maria Marcia Sanchez,gracielam190@gmail.com,,,alumni,,
Gisella,Maribel Ramirez,ramigisella@gmail.com,,,alumni,,
Nichole,Marie Northeimer,nnortheimer@gmail.com,,,alumni,,
Yarob,Marouf,babelmediaproductions@gmail.com,,,alumni,,
Jacqueline,Marquez,jackiemqz15@gmail.com,,,alumni,,
Genoveva,Marrufo Anchondo,gmarrufo119@hotmail.com,,,alumni,,
Eva,Marti Abellan,evamarti21498@gmail.com,,,alumni,,
Cynthia,Martinez,cyndmartinez1954@gmail.com,,,alumni,,
Fabiola,Martinez,fabmpernas@gmail.com,,,alumni,,
Ricardo,Martinez,martinezandree47@gmail.com,,,alumni,,
Jennifer,Marvel,jlorenapr@gmail.com,,,alumni,,
Nisreen,Mashayekh,nisreenennadi@gmail.com,,,alumni,,
Sherly,Math-Osagie,sherlycheristin@gmail.com,,,alumni,,
Cristina,Maximo,maximocristina34@gmail.com,,,alumni,,
Angela,May Steward,angelasteward@gmail.com,,,alumni,,
Estreya,Mayerlin Lopez Baca,mayerlinlb28@gmail.com,,,alumni,,
Trevor,McCoy,trevormccoy0898@gmail.com,,,alumni,,
Lorena,Medrano,marzamedranol59@gmail.com,,,alumni,,
Ismael,Mejia Thomas,ismaelmejia2301@gmail.com,,,alumni,,
Gerson,Melendez,eliah0027@gmail.com,,,alumni,,
Keila,Melendez-Gagne,iokary6125@gmail.com,,,alumni,,
Erika,Melissa Francia Gough,francia.eri@gmail.com,,,alumni,,
Yahina,Mena,yahinam@gmail.com,,,alumni,,
Maty,Michele Lara,matymichelle2012@gmail.com,,,alumni,,
Norma,Milu Angelica Gonzalez Lucio,gonzalez2020@protonmail.com,,,alumni,,
Joselyn,Miranda Flores,mirandajoselyn002@gmail.com,,,alumni,,
Alicia,Molina Hernandez,aliciah572@gmail.com,,,alumni,,
Fanny,Moncada,fmoncada4001@gmail.com,,,alumni,,
Luciany,Morgado,luberta87@gmail.com,,,alumni,,
Marie,Morpeau Haitian Kreyol,morpeaum@gmail.com,,,alumni,,
Elizabeth,Munoz,lyzy777@gmail.com,,,alumni,,
Shauntel,Muriel Lou Creque-White,shauntelcrequewhite@gmail.com,,,alumni,,
Andrea,Murza,fehercica@yahoo.com,,,alumni,,
Emma,My Duyen Tran,emmatranart@gmail.com,,,alumni,,
Tam,N Truong,nhitam@gmail.com,,,alumni,,
Anna,Najera,hernandez.a0494@gmail.com,,,alumni,,
Sandbox,Name,payments@aalb.org,,,alumni,,
Salim,Nasr,salimnasr25@gmail.com,,,alumni,,
Hilda,Natalie Chavarria Salinas,natiligo95@gmail.com,,,alumni,,
Brenda,Nataly Leon,certificate@aalb.org,,,alumni,,
Karina,Navarrete Huerta,karina.navarrete.huerta@gmail.com,,,alumni,,
Maria,Navarro,mgnavarro1982@gmail.com,,,alumni,,
Sonia,Navarro,sonianavarro2268@gmail.com,,,alumni,,
Daniela,Navia,solnvmc@gmail.com,,,alumni,,
Hanna,Negash,nhanna908@gmail.com,,,alumni,,
Breann,Nelson,brenel91@gmail.com,,,alumni,,
Cing,Nem Huai,nemnemhuai@gmail.com,,,alumni,,
Yun,Nemoy,yshen.ab@gmail.com,,,alumni,,
NGOC,NGUYEN,ngoc.nguyenminh91@gmail.com,,,alumni,,
Chau,Nguyen,cmncaa@gmail.com,,,alumni,,
Snow,Nguyen,snownguyen329@gmail.com,,,alumni,,
Mackenzie,Nicole Fry,kenziefry1996@gmail.com,,,alumni,,
Margarita,Nunez,margaritanunez12.mn@gmail.com,,,alumni,,
Angelica,Nunez,angierod2121@gmail.com,,,alumni,,
Octavio,Olais,oct7olm2@gmail.com,,,alumni,,
Devanee,Orellana Flores,jocelineflore28@gmail.com,,,alumni,,
Marychantell,ortiz,chanyjoe0809@gmail.com,,,alumni,,
Evelyn,Ortiz,iviortiz123@gmail.com,,,alumni,,
keysa,osman sahardid,ksahardid@gmail.com,,,alumni,,
Ruth,Osorio Castillo,ossorio_ruth@hotmail.com,,,alumni,,
Svetlana,Ostanniaia,castilana86@gmail.com,,,alumni,,
Blanca,Ovando,blancasue78@gmail.com,,,alumni,,
Larisa,Ozeryansky,larisaozer@gmail.com,,,alumni,,
Yesenia,Paita Martinez,yessiemartinez.30@gmail.com,,,alumni,,
Robert,Palma,urkedout28@gmail.com,,,alumni,,
Karla,Pamela Hernandez,pamhernandez.arbonne@gmail.com,,,alumni,,
Jeimi,Paola Vazquez Morales,jeimivazquez0@gmail.com,,,alumni,,
Karla,Patricia Benitez,karlabenitez85.kb@gmail.com,,,alumni,,
Tyrone,Perdomo,tyroneytibisay1@gmail.com,,,alumni,,
Andres,Perez,jseba93@gmail.com,,,alumni,,
Olga,Perez,olgamargarita617@yahoo.com,,,alumni,,
Denise,Perez,denbar0902@gmail.com,,,alumni,,
Claudia,Perez - Pineda,cnperezpineda@gmail.com,,,alumni,,
Tuan,Pham Nguyen,tuantimmy75@gmail.com,,,alumni,,
Mie,Philomene Pierre Paul,sheilapierrepaul4@gmail.com,,,alumni,,
Brenda,Pinon Alvarez,brendapinon065@gmail.com,,,alumni,,
Adrean,Placeres,placeresadrean235@gmail.com,,,alumni,,
Francisco,Plascencia Ayala,franciscoplascenciaa96@gmail.com,,,alumni,,
Elisa,Plaza,eplazamdpison@gmail.com,,,alumni,,
Michelle,Ponce,poncemichellee@gmail.com,,,alumni,,
Monica,Portillo,portillomon1121@gmail.com,,,alumni,,
Alvaro,Pozada,pozada@gmail.com,,,alumni,,
Laura,Prendez,lauraprendez@gmail.com,,,alumni,,
John,Profaci,profacijohn747@gmail.com,,,alumni,,
Manuel,Puga,manuelpuga1984@gmail.com,,,alumni,,
Cindy,R Turcios,cindeert@gmail.com,,,alumni,,
Jason,Rafael Grullon,jason.r.grullon@gmail.com,,,alumni,,
Drazen,Rakanovic,dr4730@gmail.com,,,alumni,,
Edith,Ramirez,hwloveit@gmail.com,,,alumni,,
Katalina,Ramirez,kraatmi@gmail.com,,,alumni,,
Lilia,Ramos,liliaramos1109@gmail.com,,,alumni,,
Ayush,Rathi,ayrathi@outlook.com,,,alumni,,
Kellys,Reeve,kellysbless@gmail.com,,,alumni,,
Rozita,Refa,rozitarefa@gmail.com,,,alumni,,
Nathalie,Rencoret,narencoret@gmail.com,,,alumni,,
Samantha,Rendon,sg126198@gmail.com,,,alumni,,
Ruth,Restrepo,restreporuth5@gmail.com,,,alumni,,
Mariana,Rivas,marianaarr73@gmail.com,,,alumni,,
Rei,Robja,reirobja001@yahoo.com,,,alumni,,
Bruna,Rodrigues do Nascimento,brunacoburn@gmail.com,,,alumni,,
Susanna,Rodriguez,susanamtz19@hotmail.com,,,alumni,,
Camilo,Rodriguez,c.rdriguez1@outlook.com,,,alumni,,
Lucia,Rodriguez,rodriguezlucy3124@gmail.com,,,alumni,,
Liana,Rojas-Diaz,leerdiaz0924@gmail.com,,,alumni,,
Gudelia,Rosa Gallegos,rosagallegos75@gmail.com,,,alumni,,
Emma,Rosa Martin,emmarosa.sanchez@hotmail.com,,,alumni,,
Anacelia,Rosales,anacelia.rosales91@gmail.com,,,alumni,,
Rebeca,Rosario Giraud,rrosario2013.rr@gmail.com,,,alumni,,
Maria,Rose,mrsrose0813@gmail.com,,,alumni,,
Marlee,Rushing,marleerushing2020@gmail.com,,,alumni,,
Magdalena,Rzemieniewska,magdal.paczkowska@gmail.com,,,alumni,,
Aidan,S Renard,asrfamily1217@gmail.com,,,alumni,,
Samantha,S. Craig,samanthasophiac@gmail.com,,,alumni,,
Johanny,Saldivar,mrspettway0716@gmail.com,,,alumni,,
Johanna,Salinas,salinasjohanna47@gmail.com,,,alumni,,
Valentina,Samokhina,valentina.samokhina@me.com,,,alumni,,
Olga,Sanchez,olga.sanchez1107@gmail.com,,,alumni,,
Gabriela,Sanchez,g1998sanchez7@gmail.com,,,alumni,,
Perla,Sanchez,perlasanchez0718@gmail.com,,,alumni,,
Veronica,Santana,veronicasantana992@gmail.com,,,alumni,,
Guissel,Santin,gisellerebollarp@gmail.com,,,alumni,,
Christian,Santos,chrissantos1986@gmail.com,,,alumni,,
Gilda,Santos Martins,martins.dudinha@gmail.com,,,alumni,,
Maria,Selles,meselles@aol.com,,,alumni,,
Laura,Serra,laura.ines.serra@gmail.com,,,alumni,,
Daniel,Serrano Jr.,danny.serrano0430@gmail.com,,,alumni,,
Helin,Shamoon,helinshamoon94@gmail.com,,,alumni,,
Molly,Sheridan,aslmolly9@gmail.com,,,alumni,,
Ahmad,Shoaib Jalal,jobs@aalb.org,,,alumni,,
Alexander,Silkin,mrmajestickk@gmail.com,,,alumni,,
Patricia,Silva,paytchris73@gmail.com,,,alumni,,
Catherine,Smith,catsbluesdirect@gmail.com,,,alumni,,
Cristal,Soledad Calzada Tadeo,cristalcalzada0517@gmail.com,,,alumni,,
Ammy,Solis,ammys0613@gmail.com,,,alumni,,
Yelena,Solop,vega_jess@yahoo.com,,,alumni,,
Jesus,Soriano,jesohe@yahoo.com,,,alumni,,
Salma,Soto,sosa.salma34@gmail.com,,,alumni,,
Adelaide,Sousa Richardson,adelaideagsousa@gmail.com,,,alumni,,
Wendy,St Laurent,keisystlaurent@gmail.com,,,alumni,,
Nelcy,Stanford,stanfo92@gmail.com,,,alumni,,
Gerardo,Suarez,laloinator3@gmail.com,,,alumni,,
KYAW,SWAR OO,khampat07@gmail.com,,,alumni,,
Han,T Nguyen,hannguyen.resa@gmail.com,,,alumni,,
Wai-Ling,Tam,wai3tam@gmail.com,,,alumni,,
Waheeda,Tariq,waheedatariq85@gmail.com,,,alumni,,
Landry,Tchami Axel,tchamax@gmail.com,,,alumni,,
Maria,Teresa Builes,builesmaria621@gmail.com,,,alumni,,
Kevin,Thakkar,kevin042897@gmail.com,,,alumni,,
LaloBabo,the Third of TynaDocur,kevin.thakkar3791@gmail.com,,,alumni,,
LE,THI HUE TRAN,tranlethihue@gmail.com,,,alumni,,
Gimena,Tolentino-Montiel,gmontiel1522@gmail.com,,,alumni,,
Elza,Torres,etsosa.et@gmail.com,,,alumni,,
Norma,Torres,my5angelz0420@gmail.com,,,alumni,,
Sandra,Torres,sandftorres077@gmail.com,,,alumni,,
Anh,Tran,betran9@yahoo.com,,,alumni,,
Nguyen,Tran Thi Minh Thu,nguyentranminhthu.65@gmail.com,,,alumni,,
Jessica,Troche,troche463@gmail.com,,,alumni,,
Hang,Truong Dunkley,hangdunkley@gmail.com,,,alumni,,
Diep,Tu Uyen Nguyen,ndtu2002@yahoo.com,,,alumni,,
DUNG,TUONG,tuongdungteresa1973@yahoo.com,,,alumni,,
Curtis,"Turney, Jr",alchemistsmusic@gmail.com,,,alumni,,
Hector,Ulises Zamora Maldonado,h.zamorasellstx@gmail.com,,,alumni,,
Daniela,Ulloa-Molina,ulloadaniela529@gmail.com,,,alumni,,
Rocio,Urquia Santana,rociouscpt@gmail.com,,,alumni,,
Maria,V. Pando,v.pando@yahoo.com,,,alumni,,
Iris,Vaccarino,irisvac14@gmail.com,,,alumni,,
Ramses,Valle,ramsessabori@gmail.com,,,alumni,,
Geraldine,Vanessa Lilly,drafiorilo@gmail.com,,,alumni,,
Karla,Vanessa Mendez,vmendez244@gmail.com,,,alumni,,
Eduardo,Vargas,ed3014@yahoo.com,,,alumni,,
Grisanaldy,Vasquez,grisanaldy20@gmail.com,,,alumni,,
Julie,Vazquez,juliemv285@gmail.com,,,alumni,,
Cristina,vazquez cano,cristiau12@gmail.com,,,alumni,,
Cristina,vazquez cano,crisitau12@gmail.com,,,alumni,,
Alexandra,Vazquez Vargas,aiden.adalisse@gmail.com,,,alumni,,
Yesica,Velez,yesica0725@gmail.com,,,alumni,,
Diana,Veliz,dianaveliz53@gmail.com,,,alumni,,
Paula,Villaneda,paulavillaneda@hotmail.com,,,alumni,,
Mariya,Vyacheslavovna Zhdanova,mzhdanova1@gmail.com,,,alumni,,
Naomi,Wako,naomi.wako@yahoo.com,,,alumni,,
Linh,Ward,lward7707@gmail.com,,,alumni,,
JIAJIA,WEI,maggiewei@hhcd.org,,,alumni,,
Amneh,wotruba,emanfrahat@hotmail.com,,,alumni,,
Marco,Yanez,adrianyzescobar@gmail.com,,,alumni,,
Daniel,Yeluashvili,danielyleadership@gmail.com,,,alumni,,
Alexander,Youfik,ayoufik@gmail.com,,,alumni,,
Heba,Zahriyeh,zahriyehheba00@gmail.com,,,alumni,,
Yan,Zhi Ding,webelongtogod@gmail.com,,,alumni,,
Iman,Ziyad Ali,imanzali1970f@gmail.com,,,alumni,,`;
