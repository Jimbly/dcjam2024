import assert from 'assert';

export type GENDER = 'm' | 'f' | 'a';
export type NAMEPAIR = {
  name: string;
  gender: GENDER;
};

export const NAMES: NAMEPAIR[] = (`
a Hale
a Mags
m Amano
a Barick
a Takach
a Jet
m Anton
a Greaves
a Taylor
f Madi
f Rion
f Shion
a Orion
a Caldera
f Sylvia
a Jackson
f Rachel
m Marshall
a Al
f Rosemary
m Malachi
m Jack
a Gael
f Anora
m Winston
m Joshua
a Sasha
m Roman
m Tommy
f Nastya
a Alex
f Natalie
a Rusty
m Walter
m Leroy
f Dora
m Andy
f Ari
m Kylan
f Lilian
m Julian
m Tobio
f Niki
f Bella
m Xavier
f Adelaide
a Mica
m Noah
m Tristen
f Joni
f Lydia
f Zoe
m Cole
m Zach
f Samantha
f Kayleigh
m Jacob
m Freddie
f Bee
m Jay
f Dee
f Kay
f El
f Vi
f Maya
f Stella
f Edith
m Edison
m Luca
m Jackson
f Violet
a Clover
f Rose
f Jasmine
m Javor
a Phoenix
m Hoel
m Shichiro
m Elijah
m Xuan
m Gaarl
m Geron
m Duncan
m Erkki
f Satera
`).split('\n').map((a) => a.trim()).filter((a) => a).map((a) => {
  let p = a.split(' ');
  assert(p.length === 2);
  let [gender, name] = p;
  assert(gender === 'm' || gender === 'f' || gender === 'a');
  return {
    name,
    gender,
  };
});

export const NAMES_BY_GENDER: Record<GENDER, NAMEPAIR[]> = {
  m: NAMES.filter((a) => a.gender !== 'f'),
  f: NAMES.filter((a) => a.gender !== 'm'),
  a: NAMES,
};
