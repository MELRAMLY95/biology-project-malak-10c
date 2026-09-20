window.CLONING = window.CLONING || {};

CLONING.CHECKS = [
  {
    id: "c-def",
    q: "What is a clone?",
    opts: [
      "An organism genetically identical (same nuclear DNA) to another",
      "Any offspring of sexual reproduction",
      "An organism that looks similar because of the environment",
      "A cell that has no nucleus"
    ],
    a: 0,
    why: "Mark scheme: genetically identical / same genes / same DNA. Appearance can still differ."
  },
  {
    id: "c-nuc",
    q: "The clone’s nuclear DNA came from which organism?",
    opts: ["Egg donor", "Nuclear / somatic-cell donor", "Surrogate mother", "Both egg donor and surrogate equally"],
    a: 1,
    why: "The diploid nucleus is taken from a mature body cell. That genome is copied by mitosis."
  },
  {
    id: "c-enuc",
    q: "Why is the egg nucleus removed?",
    opts: [
      "To prevent the egg’s DNA mixing with the donor nucleus / wrong chromosome number",
      "To create mitochondria",
      "To sterilise the cell",
      "So the surrogate can donate genes"
    ],
    a: 0,
    why: "Leave the egg haploid nucleus in and you no longer have a clean copy of one genome."
  },
  {
    id: "c-surr",
    q: "What is the role of the surrogate?",
    opts: [
      "She provides the uterus / pregnancy, not the nuclear genome",
      "She donates half the chromosomes",
      "She supplies the diploid nucleus",
      "She is genetically identical to the clone"
    ],
    a: 0,
    why: "Environment of development ≠ source of nuclear DNA."
  },
  {
    id: "c-var",
    q: "Why can cloning reduce genetic variation?",
    opts: [
      "Many individuals share one genome, so fewer alleles in the population",
      "Mitosis always mutates DNA",
      "Clones cannot reproduce",
      "Electric pulses destroy chromosomes"
    ],
    a: 0,
    why: "A narrow gene pool is more vulnerable if conditions change."
  },
  {
    id: "c-split",
    q: "Which process splits an early embryo into genetically identical individuals?",
    opts: ["Embryo splitting", "Meiosis", "Enucleation only", "Selective breeding"],
    a: 0,
    why: "Those individuals match each other (and the original embryo), not a chosen adult — unless that embryo came from SCNT."
  },
  {
    id: "c-pulse",
    q: "What does the electric pulse do in SCNT?",
    opts: [
      "It activates the reconstructed egg so mitosis can begin — it does not add DNA",
      "It writes the donor genes into the egg",
      "It sterilises the cytoplasm",
      "It copies mitochondrial DNA from the surrogate"
    ],
    a: 0,
    why: "Activation starts division. The genome is already the donor nucleus."
  },
  {
    id: "c-plant",
    q: "Why must explants be surface-sterilised?",
    opts: [
      "To prevent fungi or bacteria contaminating the nutrient medium",
      "To add extra chromosomes",
      "To make the plant transgenic",
      "To enucleate plant cells"
    ],
    a: 0,
    why: "Tissue culture is in vitro on rich medium — contaminants outcompete the explant."
  },
  {
    id: "c-pheno",
    q: "Two clones can still look different because",
    opts: [
      "Phenotype = genotype + environment; nuclear DNA matching does not freeze all traits",
      "Clones have different nuclear DNA",
      "Mitosis shuffles alleles like meiosis",
      "The surrogate donates half the chromosomes"
    ],
    a: 0,
    why: "Same genes ≠ same phenotype if diet, disease, or conditions differ."
  },
  {
    id: "c-tg",
    q: "After a human insulin gene is in a bacterium, why clone the host?",
    opts: [
      "So many identical cells keep and express the inserted gene",
      "To remove the gene again",
      "Because bacteria cannot divide otherwise",
      "To mix it with a surrogate’s DNA"
    ],
    a: 0,
    why: "Clonal culture multiplies the transgenic genome. This is the 5.20B idea, not a restriction-enzyme protocol."
  }
];

CLONING.EXAM = [
  {
    id: "e1",
    marks: 1,
    type: "short",
    q: "Define a clone. (1)",
    keywords: [["genetically identical"], ["same dna"], ["same genes"], ["identical dna"]],
    scheme: "An organism (or cell) that is genetically identical / has the same DNA as another."
  },
  {
    id: "e2",
    marks: 2,
    type: "short",
    q: "State why the nucleus is removed from the egg cell before nuclear transfer. (2)",
    keywords: [["enucleat"], ["remov"], ["haploid"], ["egg nucleus"], ["mix"], ["chromosome"], ["donor dna"], ["only"]],
    need: 2,
    scheme: "Award: remove the egg’s nucleus / enucleate (1); so the clone has only the donor’s nuclear DNA / prevent mixing genomes / correct chromosome number (1)."
  },
  {
    id: "e3",
    marks: 4,
    type: "long",
    q: "Describe how a cloned mammal can be produced by introducing a diploid nucleus from a mature cell into an enucleated egg. (4)",
    keywords: [["diploid"], ["somatic"], ["body cell"], ["mature"], ["enucleat"], ["egg"], ["insert"], ["transfer"], ["electric"], ["pulse"], ["shock"], ["mitosis"], ["embryo"], ["surrogate"], ["uterus"]],
    need: 4,
    scheme: "Typical points: diploid nucleus from mature/somatic cell; egg enucleated; nucleus inserted; electric pulse / activation; mitosis → embryo; implant in surrogate. Any 4."
  },
  {
    id: "e4",
    marks: 2,
    type: "short",
    q: "Explain why the clone is genetically identical to the nuclear donor and not to the surrogate. (2)",
    keywords: [["nuclear dna"], ["nucleus"], ["donor"], ["mitosis"], ["surrogate"], ["uterus"], ["environment"], ["not genes"], ["egg enucleat"]],
    need: 2,
    scheme: "Nuclear DNA comes from the donor nucleus / copied by mitosis (1). Surrogate provides uterus / not nuclear genes; egg nucleus was removed (1)."
  },
  {
    id: "e5",
    marks: 2,
    type: "short",
    q: "State one advantage and one disadvantage of cloning mammals. (2)",
    keywords: [["desirable"], ["identical"], ["research"], ["agriculture"], ["conserv"], ["protein"], ["transgenic"], ["success"], ["ethic"], ["variation"], ["health"], ["expensive"], ["welfare"]],
    need: 2,
    scheme: "Advantage e.g. copy desirable characteristics / research animals / transgenic proteins. Disadvantage e.g. low success, ethics, low variation, health issues, cost."
  },
  {
    id: "e6",
    marks: 3,
    type: "long",
    q: "Explain how cloning can reduce genetic variation in a population and why this can be a problem. (3)",
    keywords: [["same genes"], ["identical"], ["alleles"], ["variation"], ["disease"], ["environment"], ["change"], ["vulnerable"], ["wipe"]],
    need: 3,
    scheme: "Clones share a genome (1); fewer different alleles in the population (1); a disease or environmental change may affect all of them (1)."
  },
  {
    id: "e7",
    marks: 3,
    type: "long",
    q: "Describe micropropagation (tissue culture) in plants. (3)",
    keywords: [["explant"], ["steril"], ["in vitro"], ["agar"], ["nutrient"], ["hormone"], ["callus"], ["plantlet"], ["mitosis"]],
    need: 3,
    scheme: "Explant; sterilise / in vitro nutrient agar + hormones; callus / mitosis; plantlets transplanted. Any 3."
  },
  {
    id: "e8",
    marks: 2,
    type: "short",
    q: "Explain how cloned transgenic animals can be used to produce human proteins. (2)",
    keywords: [["transgenic"], ["human gene"], ["protein"], ["milk"], ["clone"], ["identical"], ["same gene"]],
    need: 2,
    scheme: "Transgenic animal makes a human protein (e.g. in milk) (1); cloning copies that genotype so many animals produce the same protein (1)."
  }
];

CLONING.markExam = function (item, text) {
  const t = (text || "").toLowerCase();
  const hits = new Set();
  (item.keywords || []).forEach((group) => {
    if (group.some((k) => t.includes(k))) hits.add(group[0]);
  });
  const need = item.need || 1;
  const raw = hits.size;
  const score = Math.min(item.marks, item.marks === 1 ? (raw >= 1 ? 1 : 0) : Math.min(item.marks, raw));
  // 1-mark: any one phrase. multi-mark: one mark per distinct keyword group, capped.
  const awarded = item.marks === 1 ? (raw >= 1 ? 1 : 0) : Math.min(item.marks, raw);
  return { awarded, hits: raw, need };
};
