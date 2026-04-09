Do frameworku je potreba pridat podporu pro "akce". Ty budou slozit k modelovani aktivit v prubehu tahove hry.

Invarianty:
  - "akce" je datovy objekt, ktery neobsahuje logiku. Priklad akci: "utok", "zraneni", "smrt", "vznik predmetu"
  - akce jsou typicky generovany ve spolupraci se Schedulerem, ktery vyzve vhodnou entitu k vygenerovani akce
  - pro Scheduler, ktery pracuje s promenlivou dobou trvani (rychlosti), je nezbytne nejakym zpusobem zpetne zpropagovat dobu trvani akce
  - akce jsou primarne zpracovavany hernim systemem, ktery je umi vyhodnotit a adekvatne zmenit herni stav
  - zaroven ale akce prochazeji takze napr. skrz "logger" (ktery je v textove podobe vypise na obrazovku), nebo "displej" (ktery adekvatne upravi herni mapu)
  - je obvykle, ze zpracovani jedne akce zpusobi vznik dalsich ("utok" zpusobi "zraneni", toto zpusobi "smrt", toto vyvolani "vznik predmetu mrtvola na dane pozici")

Je treba vymyslet, jak spravne akce generovat a jak je v ramci pipeline zpracovavat.
