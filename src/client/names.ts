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
  f: NAMES.filter((a) => a.gender !== 'a'),
  a: NAMES,
};
