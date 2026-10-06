/**
 * RuralRise seed data.
 *
 * DEMO DATA NOTICE: Every record marked isDemo: true is sample content for
 * demonstration and testing only. Real opportunities, schemes, and trainings
 * carry a sourceUrl / officialLink pointing to a government or provider page.
 * Nothing here is financial or legal advice.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  console.log("Seeding RuralRise data...");

  // ---- Skills ----
  const skillNames = [
    "Mobilization",
    "Basic English",
    "Digital Literacy",
    "Tailoring",
    "Embroidery",
    "Dairy Farming",
    "Poultry Care",
    "Organic Farming",
    "Drip Irrigation",
    "Food Preservation",
    "Baking",
    "Two-Wheeler Repair",
    "Mobile Phone Repair",
    "Solar Panel Installation",
    "Masonry",
    "Electrical Wiring",
    "Plumbing",
    "Carpentry",
    "Data Entry",
    "Customer Service",
    "Bookkeeping",
    "Social Media Marketing",
    "Handloom Weaving",
    "Pottery",
    "Beekeeping",
    "Mushroom Cultivation",
    "Nursery Management",
    "Welding",
    "CNC Operation",
    "Driving",
    "Health Sanitation",
    "Community Health",
    "Agri Marketing",
    "Packaging",
    "Quality Checking",
  ];
  for (const name of skillNames) {
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name, slug: slug(name) },
    });
  }
  const skill = async (name: string) =>
    (await prisma.skill.findUnique({ where: { name } }))!;

  // ---- Categories ----
  const catDefs = [
    {
      name: "Farm & Allied",
      icon: "leaf",
      description:
        "Farming, dairy, poultry, fisheries and allied rural livelihoods",
    },
    {
      name: "Handicrafts & Textiles",
      icon: "scissors",
      description: "Weaving, tailoring, pottery and traditional crafts",
    },
    {
      name: "Retail & Sales",
      icon: "store",
      description: "Shop keeping, sales, distribution and marketing roles",
    },
    {
      name: "Services & Repairs",
      icon: "wrench",
      description: "Repair services, electrical, plumbing and technical trades",
    },
    {
      name: "Digital & Remote",
      icon: "laptop",
      description: "Data entry, remote support, digital services",
    },
    {
      name: "Health & Community",
      icon: "heart",
      description: "Community health, sanitation and social work",
    },
    {
      name: "Construction",
      icon: "hard-hat",
      description: "Masonry, carpentry and construction work",
    },
    {
      name: "Food Processing",
      icon: "utensils",
      description: "Bakery, preservation and food production units",
    },
  ];
  for (const c of catDefs) {
    await prisma.category.upsert({
      where: { slug: slug(c.name) },
      update: {},
      create: { ...c, slug: slug(c.name) },
    });
  }
  const cat = async (name: string) =>
    (await prisma.category.findUnique({ where: { slug: slug(name) } }))!;

  // ---- Demo users ----
  const password = await bcrypt.hash("Password123!", 12);

  const youth = await prisma.user.upsert({
    where: { email: "youth@demo.ruralrise.in" },
    update: {},
    create: {
      email: "youth@demo.ruralrise.in",
      passwordHash: password,
      name: "Anita Kumari",
      role: "YOUTH",
      district: "Warangal",
      state: "Telangana",
      phone: "+919000000001",
      profile: {
        create: {
          education: "12th",
          village: "Khanapur",
          district: "Warangal",
          state: "Telangana",
          preferredRadiusKm: 25,
          interests: ["handicrafts", "digital"],
          skills: ["Tailoring", "Basic English", "Digital Literacy"],
          availability: "Full time",
          languages: ["Telugu", "Hindi"],
          experience: "Helped family tailoring shop for 2 years.",
          careerGoals: "Wants to run her own boutique and sell online.",
        },
      },
    },
  });

  const employer = await prisma.user.upsert({
    where: { email: "employer@demo.ruralrise.in" },
    update: {},
    create: {
      email: "employer@demo.ruralrise.in",
      passwordHash: password,
      name: "Ravi Sharma",
      role: "EMPLOYER",
      district: "Warangal",
      state: "Telangana",
      phone: "+919000000002",
      organization: {
        create: {
          name: "Warangal Agro Services",
          about: "Local agri-services and poultry cooperative.",
          district: "Warangal",
          state: "Telangana",
          contactEmail: "employer@demo.ruralrise.in",
          verified: true,
        },
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.ruralrise.in" },
    update: {},
    create: {
      email: "admin@demo.ruralrise.in",
      passwordHash: password,
      name: "Meena Rao",
      role: "ADMIN",
      district: "Hyderabad",
      state: "Telangana",
      phone: "+919000000003",
    },
  });

  const org = await prisma.organization.findUnique({
    where: { ownerId: employer.id },
  })!;

  // ---- Opportunities ----
  const oppDefs: Array<{
    title: string;
    category: string;
    workType: any;
    description: string;
    district?: string;
    village?: string;
    isRemote?: boolean;
    min?: number;
    max?: number;
    basis?: string;
    skills: string[];
    education?: string;
    time?: string;
    eligibility?: string;
    sourceUrl?: string;
    sourceLabel?: string;
  }> = [
    {
      title: "Tailoring Unit Stitcher",
      category: "Handicrafts & Textiles",
      workType: "LOCAL_JOB",
      description:
        "A growing tailoring unit in Khanapur needs stitchers for blouse, salwar and school uniform orders. Training provided for the first month. Piece-rate plus monthly bonus for quality work. Women returning to work are encouraged to apply.",
      district: "Warangal",
      village: "Khanapur",
      min: 8000,
      max: 14000,
      basis: "monthly",
      skills: ["Tailoring", "Embroidery"],
      time: "Full time (9am-6pm)",
    },
    {
      title: "Poultry Farm Assistant",
      category: "Farm & Allied",
      workType: "LOCAL_JOB",
      description:
        "Assist daily poultry care at a 2000-bird farm: feeding, egg collection, health checks and record keeping. No prior experience required; on-the-job training by the supervisor. Safe accommodation available for outstation candidates.",
      district: "Warangal",
      min: 9000,
      max: 13000,
      basis: "monthly",
      skills: ["Poultry Care"],
      time: "Full time",
    },
    {
      title: "Data Entry Executive (Remote)",
      category: "Digital & Remote",
      workType: "REMOTE_JOB",
      description:
        "Work-from-home data entry for a state agriculture survey digitization project. Requires basic computer skills and accurate typing. Weekly payout with accuracy-linked incentives. Flexible hours, must have a smartphone or computer with internet.",
      isRemote: true,
      min: 7000,
      max: 12000,
      basis: "monthly",
      skills: ["Data Entry", "Digital Literacy"],
      time: "Flexible (20 hrs/week)",
      education: "12th",
    },
    {
      title: "Dairy Collection Centre Operator",
      category: "Farm & Allied",
      workType: "LOCAL_JOB",
      description:
        "Operate the morning and evening milk collection centre: testing fat content, weighing, maintaining registers and coordinating with the chilling van. Familiarity with dairy practices preferred.",
      district: "Warangal",
      min: 10000,
      max: 15000,
      basis: "monthly",
      skills: ["Dairy Farming", "Bookkeeping"],
      time: "Morning & evening shifts",
    },
    {
      title: "Mobile Phone Repair Apprentice",
      category: "Services & Repairs",
      workType: "APPRENTICESHIP",
      description:
        "Six-month paid apprenticeship at an authorized mobile service centre. Learn screen replacement, software flashing and customer handling. Stipend with certificate on completion; strong performers get absorbed.",
      district: "Warangal",
      min: 6000,
      max: 8000,
      basis: "monthly",
      skills: ["Mobile Phone Repair", "Customer Service"],
      time: "Full time",
    },
    {
      title: "Organic Vegetable Grower (Self Employment)",
      category: "Farm & Allied",
      workType: "SELF_EMPLOYMENT",
      description:
        "Start organic vegetable cultivation on 0.5-1 acre with buy-back assurance from a local retailer network. Guidance on composting, seed selection and drip setup. Suitable for households with small land holdings.",
      district: "Warangal",
      min: 8000,
      max: 20000,
      basis: "monthly",
      skills: ["Organic Farming", "Drip Irrigation", "Agri Marketing"],
      time: "Own schedule",
      eligibility: "Access to at least 0.5 acre of land",
    },
    {
      title: "Handloom Weaver",
      category: "Handicrafts & Textiles",
      workType: "LOCAL_JOB",
      description:
        "Pochampally ikat weavers cooperative seeks weavers for saree and dupatta orders. Loom access available for those without their own. Advance payments against delivery schedules.",
      district: "Warangal",
      min: 9000,
      max: 18000,
      basis: "monthly",
      skills: ["Handloom Weaving"],
      time: "Flexible",
    },
    {
      title: "Community Health Volunteer",
      category: "Health & Community",
      workType: "PART_TIME",
      description:
        "Support village health awareness sessions, immunization follow-ups and sanitation drives under the local primary health centre. Honorarium plus travel allowance. Preferred for candidates known and trusted in their village.",
      district: "Warangal",
      min: 3000,
      max: 5000,
      basis: "monthly",
      skills: ["Community Health", "Mobilization"],
      time: "Part time",
    },
    {
      title: "Two-Wheeler Service Helper",
      category: "Services & Repairs",
      workType: "LOCAL_JOB",
      description:
        "Assist a busy two-wheeler service point: washing, general servicing support, spare parts billing and customer coordination. Learning opportunity with the head mechanic.",
      district: "Warangal",
      min: 8000,
      max: 11000,
      basis: "monthly",
      skills: ["Two-Wheeler Repair", "Customer Service"],
      time: "Full time",
    },
    {
      title: "Bakery Production Assistant",
      category: "Food Processing",
      workType: "LOCAL_JOB",
      description:
        "A new bakery unit needs production assistants for biscuits and bread: mixing, moulding, baking supervision and packaging. Hygiene training provided; food-safety certificate a plus.",
      district: "Warangal",
      min: 9000,
      max: 12000,
      basis: "monthly",
      skills: ["Baking", "Food Preservation", "Packaging"],
      time: "Full time",
    },
    {
      title: "Freelance Content Verifier (Local Language)",
      category: "Digital & Remote",
      workType: "FREELANCE",
      description:
        "Verify and transcribe short audio clips in Telugu for a voice-dataset project. Per-task payment via UPI. Work from home with a smartphone. Accuracy threshold applies.",
      isRemote: true,
      min: 5000,
      max: 15000,
      basis: "per_task",
      skills: ["Basic English", "Digital Literacy"],
      time: "Flexible",
      eligibility: "Fluent Telugu reading and writing",
    },
    {
      title: "Solar Pump Installation Helper",
      category: "Services & Repairs",
      workType: "LOCAL_JOB",
      description:
        "Join a solar irrigation company as an installation helper: panel mounting, pump fitting and farmer demonstrations. Outdoor work across villages; two-wheeler licence preferred.",
      district: "Warangal",
      min: 10000,
      max: 14000,
      basis: "monthly",
      skills: ["Solar Panel Installation", "Electrical Wiring"],
      time: "Full time",
    },
  ];

  const createdOpps: {
    id: string;
    slug: string;
    skills: string[];
    workType: string;
    isRemote: boolean;
    district?: string;
    title: string;
  }[] = [];
  for (const o of oppDefs) {
    const s = slug(o.title);
    const existing = await prisma.opportunity.findUnique({
      where: { slug: s },
    });
    if (existing) {
      createdOpps.push({
        id: existing.id,
        slug: existing.slug,
        skills: o.skills,
        workType: o.workType,
        isRemote: !!o.isRemote,
        district: o.district,
        title: o.title,
      });
      continue;
    }
    const created = await prisma.opportunity.create({
      data: {
        title: o.title,
        slug: s,
        description: o.description,
        categoryId: (await cat(o.category)).id,
        organizationId: (await prisma.organization.findUnique({
          where: { ownerId: employer.id },
        }))!.id,
        workType: o.workType,
        isRemote: !!o.isRemote,
        village: o.village,
        district: o.district,
        state: "Telangana",
        compensationMin: o.min,
        compensationMax: o.max,
        paymentBasis: o.basis,
        eligibility: o.eligibility,
        requiredEducation: o.education,
        timeCommitment: o.time,
        verification: "VERIFIED",
        isDemo: true,
        expiresAt: new Date(Date.now() + 90 * 86400000),
        skills: {
          create: await Promise.all(
            o.skills.map(async (name) => ({
              skillId: (await skill(name))!.id,
              required: true,
            })),
          ),
        },
      },
    });
    createdOpps.push({
      id: created.id,
      slug: created.slug,
      skills: o.skills,
      workType: o.workType,
      isRemote: !!o.isRemote,
      district: o.district,
      title: o.title,
    });
  }

  // ---- Training programs ----
  const trainingDefs = [
    {
      title: "Basic Tailoring & Garment Construction",
      provider: "Govt. ITI Warangal",
      dur: "3 months",
      mode: "offline",
      fee: "Free",
      skills: ["Tailoring", "Embroidery"],
      cert: true,
      link: "https://skilldevelopment.telangana.gov.in",
    },
    {
      title: "Digital Literacy & Smartphone Use",
      provider: "PMGDISHA (Demo listing)",
      dur: "20 hours",
      mode: "hybrid",
      fee: "Free",
      skills: ["Digital Literacy", "Data Entry"],
      cert: true,
      link: "https://www.pmgdisha.in",
    },
    {
      title: "Dairy Farming & Animal Husbandry Basics",
      provider: "KVK Warangal",
      dur: "2 weeks",
      mode: "offline",
      fee: "Free",
      skills: ["Dairy Farming"],
      cert: false,
      link: "https://kvk.icar.gov.in",
    },
    {
      title: "Organic Farming & Composting",
      provider: "KVK Warangal",
      dur: "10 days",
      mode: "offline",
      fee: "Free",
      skills: ["Organic Farming", "Agri Marketing"],
      cert: false,
      link: "https://kvk.icar.gov.in",
    },
    {
      title: "Mobile Phone Repair Technician",
      provider: "Skill India (Demo listing)",
      dur: "6 weeks",
      mode: "offline",
      fee: "Subsidized",
      skills: ["Mobile Phone Repair"],
      cert: true,
      link: "https://www.skillindia.gov.in",
    },
    {
      title: "Data Entry & Office Productivity",
      provider: "Skill India (Demo listing)",
      dur: "4 weeks",
      mode: "online",
      fee: "Free",
      skills: ["Data Entry", "Bookkeeping"],
      cert: true,
      link: "https://www.skillindia.gov.in",
    },
    {
      title: "Poultry Entrepreneurship",
      provider: "NABARD-supported KVK",
      dur: "2 weeks",
      mode: "offline",
      fee: "Free",
      skills: ["Poultry Care"],
      cert: false,
      link: "https://www.nabard.org",
    },
    {
      title: "Spoken English for Work",
      provider: "Community Learning Centre",
      dur: "8 weeks",
      mode: "hybrid",
      fee: "Nominal",
      skills: ["Basic English", "Customer Service"],
      cert: false,
      link: undefined,
    },
    {
      title: "Solar PV Installation Assistant",
      provider: "Skill India (Demo listing)",
      dur: "6 weeks",
      mode: "offline",
      fee: "Subsidized",
      skills: ["Solar Panel Installation", "Electrical Wiring"],
      cert: true,
      link: "https://www.skillindia.gov.in",
    },
    {
      title: "Food Processing & Packaging Basics",
      provider: "DIC Warangal",
      dur: "3 weeks",
      mode: "offline",
      fee: "Free",
      skills: ["Food Preservation", "Packaging"],
      cert: false,
      link: "https://msme.telangana.gov.in",
    },
  ];
  for (const t of trainingDefs) {
    const s = slug(t.title);
    await prisma.trainingProgram.upsert({
      where: { slug: s },
      update: {},
      create: {
        title: t.title,
        slug: s,
        description: `${t.title} — offered by ${t.provider}. Duration: ${t.dur}, mode: ${t.mode}, fee: ${t.fee}. Demo listing; verify details on the official site before enrolling.`,
        providerName: t.provider,
        providerVerified: t.link ? true : false,
        isDemo: true,
        duration: t.dur,
        mode: t.mode,
        fee: t.fee,
        certification: t.cert,
        link: t.link,
        skills: {
          create: await Promise.all(
            t.skills.map(async (name) => ({ skillId: (await skill(name))!.id })),
          ),
        },
      },
    });
  }

  // ---- Government schemes (real, publicly known, with official links) ----
  const schemeDefs = [
    {
      title:
        "Deendayal Antyodaya Yojana – National Rural Livelihoods Mission (DAY-NRLM)",
      ministry: "Ministry of Rural Development",
      category: "livelihood",
      description:
        "Mobilizes rural poor women into Self-Help Groups (SHGs), provides revolving fund, access to bank credit and livelihood support for farm and non-farm activities.",
      eligibility:
        "Rural poor households, prioritized through the SECC and Participatory Identification of the Poor",
      benefits:
        "SHG membership, revolving fund, bank linkage, skill training and community enterprise support",
      steps: [
        "Contact your village SHG or block mission unit",
        "Enrol in an SHG under DAY-NRLM",
        "Access revolving fund and bank credit",
        "Apply for skill or enterprise support",
      ],
      link: "https://aajeevika.gov.in",
    },
    {
      title: "Pradhan Mantri Kaushal Vikas Yojana (PMKVY)",
      ministry: "Ministry of Skill Development and Entrepreneurship",
      category: "skilling",
      description:
        "Short-term skill training and certification for Indian youth, aligned to industry-recognized National Skills Qualification Framework (NSQF) job roles.",
      eligibility:
        "Indian nationals aged 15-45 who are school/college dropouts or unemployed",
      benefits:
        "Free short-term training, assessment and certification, placement assistance",
      steps: [
        "Find an approved PMKVY training centre near you",
        "Choose a job role and enrol",
        "Complete training and assessment",
        "Receive NSQF certificate and placement support",
      ],
      link: "https://www.pmkvyofficial.org",
    },
    {
      title: "MUDRA Loan (Shishu / Kishor / Tarun)",
      ministry: "Ministry of Finance",
      category: "entrepreneurship",
      description:
        "Collateral-free micro-credit for non-farm income-generating activities such as tailoring units, kirana shops, service repair and food processing.",
      eligibility: "Any Indian citizen planning a non-farm micro-enterprise",
      benefits:
        "Loans up to Rs. 10 lakh across Shishu, Kishor and Tarun categories, collateral-free",
      steps: [
        "Prepare a simple business plan and cost estimate",
        "Approach a bank, MFI or NBFC with KYC documents",
        "Fill the Mudra application form",
        "Receive loan and start the activity",
      ],
      link: "https://www.mudra.org.in",
    },
    {
      title: "MGNREGA (Right to Work)",
      ministry: "Ministry of Rural Development",
      category: "employment",
      description:
        "Guarantees up to 100 days of paid unskilled wage employment per rural household per financial year, on demand.",
      eligibility: "Adult members of rural households with a job card",
      benefits:
        "Guaranteed wage employment, worksite facilities, timely wage payment",
      steps: [
        "Apply for a job card at the Gram Panchayat",
        "Submit a written work demand",
        "Work is allotted within 15 days",
        "Receive wages (typically within a fortnight of the muster week)",
      ],
      link: "https://nrega.nic.in",
    },
    {
      title: "Stand-Up India",
      ministry: "Ministry of Finance",
      category: "entrepreneurship",
      description:
        "Bank loans between Rs. 10 lakh and Rs. 1 crore for SC/ST and women entrepreneurs to set up greenfield enterprises in manufacturing, services, trading or agri-allied activities.",
      eligibility:
        "SC/ST and women entrepreneurs aged above 18 setting up a greenfield enterprise",
      benefits:
        "Composite loan covering working capital, margin money support, handholding support",
      steps: [
        "Develop a business plan",
        "Register on the Stand-Up India portal",
        "Get handholding support for DPR and training",
        "Approach a scheduled bank for the loan",
      ],
      link: "https://www.standupmitra.in",
    },
    {
      title: "PM Vishwakarma",
      ministry: "Ministry of Micro, Small and Medium Enterprises",
      category: "skilling",
      description:
        "Support for traditional artisans and craftspeople: recognition certificate, skill training, toolkit incentive, collateral-free credit and marketing support.",
      eligibility:
        "Artisans/craftspeople engaged in one of the 18 notified traditional trades, unorganized workers aged 18+",
      benefits:
        "Toolkit e-voucher, training stipend, collateral-free enterprise loans, digital transaction incentives",
      steps: [
        "Register on the PM Vishwakarma portal via CSC",
        "Obtain the Vishwakarma certificate and ID",
        "Avail basic skill training",
        "Apply for toolkit incentive and credit",
      ],
      link: "https://pmvishwakarma.gov.in",
    },
    {
      title: "Deendayal Upadhyaya Grameen Kaushalya Yojana (DDU-GKY)",
      ministry: "Ministry of Rural Development",
      category: "skilling",
      description:
        "Placement-linked skill development program for poor rural youth, with guaranteed placement assistance for trained candidates.",
      eligibility:
        "Rural poor youth aged 15-35 (up to 45 for some vulnerable groups)",
      benefits:
        "Free residential skill training, post-placement support, guaranteed placement assistance",
      steps: [
        "Visit the block DDU-GKY / mission office or a training partner",
        "Verify eligibility and enrol",
        "Complete residential training",
        "Get placement and post-placement tracking support",
      ],
      link: "https://ddugky.gov.in",
    },
    {
      title:
        "National Rural Economic Transformation Project (NRETP) Enterprise Support",
      ministry: "Ministry of Rural Development",
      category: "livelihood",
      description:
        "Supports SHG women to set up individual and group enterprises through enterprise acceleration, access to finance and market linkages.",
      eligibility: "Women members of DAY-NRLM SHGs in NRETP states",
      benefits:
        "Enterprise incubation, mentorship, interest subvention, market linkage support",
      steps: [
        "Be an active SHG member under DAY-NRLM",
        "Express enterprise interest to the block mission unit",
        "Participate in enterprise acceleration training",
        "Avail credit and market linkage support",
      ],
      link: "https://aajeevika.gov.in",
    },
    {
      title: "Prime Minister's Employment Generation Programme (PMEGP)",
      ministry: "Ministry of MSME",
      category: "entrepreneurship",
      description:
        "Credit-linked subsidy for micro-enterprises: beneficiaries get up to 35% margin money subsidy in rural areas (higher for special categories).",
      eligibility:
        "Individuals above 18 years; self-help groups, trusts and co-operative societies also eligible",
      benefits:
        "Project cost up to Rs. 50 lakh (manufacturing) / Rs. 20 lakh (service) with margin money subsidy",
      steps: [
        "Prepare a project report",
        "Apply online on the PMEGP portal",
        "Attend EDP training after sanction",
        "Set up the unit and claim subsidy",
      ],
      link: "https://www.kviconline.gov.in/pmegpeportal",
    },
    {
      title: "Ayushman Bharat – PM Jan Arogya Yojana",
      ministry: "Ministry of Health and Family Welfare",
      category: "health",
      description:
        "Health cover of Rs. 5 lakh per family per year for secondary and tertiary care hospitalization for poor and vulnerable families.",
      eligibility:
        "Families identified as per SECC 2011 criteria in rural and urban areas",
      benefits:
        "Cashless treatment up to Rs. 5 lakh per family per year at empanelled hospitals",
      steps: [
        "Check family name on the beneficiary portal",
        "Get the Ayushman card made at a CSC or empanelled hospital",
        "Use the card at any empanelled hospital",
      ],
      link: "https://pmjay.gov.in",
    },
  ];
  for (const s of schemeDefs) {
    await prisma.scheme.upsert({
      where: { slug: slug(s.title) },
      update: {},
      create: {
        title: s.title,
        slug: slug(s.title),
        ministry: s.ministry,
        category: s.category,
        description: s.description,
        eligibility: s.eligibility,
        benefits: s.benefits,
        applySteps: s.steps,
        officialLink: s.link,
      },
    });
  }

  // ---- Business ideas (demo) ----
  const ideaDefs = [
    {
      title: "Boutique Tailoring Shop",
      category: "Handicrafts & Textiles",
      skills: ["Tailoring", "Embroidery"],
      cost: [25000, 80000],
      income: [10000, 30000],
      desc: "A village boutique offering blouses, uniforms and alterations, with design customization and home delivery. Can grow into an online boutique with WhatsApp ordering.",
    },
    {
      title: "Poultry Unit (200-500 birds)",
      category: "Farm & Allied",
      skills: ["Poultry Care"],
      cost: [30000, 90000],
      income: [8000, 25000],
      desc: "Backyard to small commercial poultry for eggs or meat. Steady cash cycle with 45-day broiler batches; NABARD-subsidized training helps.",
    },
    {
      title: "Mushroom Cultivation Unit",
      category: "Farm & Allied",
      skills: ["Organic Farming"],
      cost: [15000, 50000],
      income: [6000, 20000],
      desc: "Oyster or button mushrooms in a low-cost shed. Short crop cycles, strong local hotel and retailer demand, and buyback options in many districts.",
    },
    {
      title: "Mobile Repair Kiosk",
      category: "Services & Repairs",
      skills: ["Mobile Phone Repair", "Customer Service"],
      cost: [40000, 100000],
      income: [10000, 30000],
      desc: "Screen, battery and software repair services plus accessories sales. High margins and growing smartphone penetration in villages.",
    },
    {
      title: "Home Bakery & Tiffin Service",
      category: "Food Processing",
      skills: ["Baking", "Food Preservation"],
      cost: [20000, 60000],
      income: [8000, 25000],
      desc: "Cookies, cakes and lunch tiffins for schools, offices and hostels. FSSAI registration builds trust and unlocks institutional orders.",
    },
    {
      title: "Dairy Milk Collection Agency",
      category: "Farm & Allied",
      skills: ["Dairy Farming", "Bookkeeping"],
      cost: [20000, 70000],
      income: [8000, 22000],
      desc: "Set up a collection point for a dairy cooperative with a milking-animal supply network. Commission per litre plus incentives.",
    },
    {
      title: "Agri-input & Seed Shop",
      category: "Retail & Sales",
      skills: ["Agri Marketing"],
      cost: [50000, 150000],
      income: [12000, 35000],
      desc: "Licensed shop for seeds, fertilizers and tools with advisory support for farmers. Strong repeat demand in farming clusters.",
    },
    {
      title: "Two-Wheeler Service Point",
      category: "Services & Repairs",
      skills: ["Two-Wheeler Repair"],
      cost: [60000, 120000],
      income: [10000, 28000],
      desc: "Washing, servicing and minor repairs for two-wheelers along a highway or market road. Insurance renewals add revenue.",
    },
    {
      title: "Handicraft E-commerce Collective",
      category: "Handicrafts & Textiles",
      skills: ["Handloom Weaving", "Social Media Marketing"],
      cost: [10000, 40000],
      income: [7000, 25000],
      desc: "Aggregate local weavers and artisans, standardize quality, sell via marketplaces and social media with flat-rate courier tie-ups.",
    },
    {
      title: "Village DTP & Online Services Centre",
      category: "Digital & Remote",
      skills: ["Data Entry", "Digital Literacy"],
      cost: [40000, 90000],
      income: [8000, 20000],
      desc: "CSC-style centre for forms, printing, photocopies, bill payments and online government applications.",
    },
  ];
  for (const i of ideaDefs) {
    await prisma.businessIdea.upsert({
      where: { slug: slug(i.title) },
      update: {},
      create: {
        title: i.title,
        slug: slug(i.title),
        description: i.desc,
        categoryId: (await cat(i.category)).id,
        skills: i.skills,
        startupCostMin: i.cost[0],
        startupCostMax: i.cost[1],
        monthlyIncomeMin: i.income[0],
        monthlyIncomeMax: i.income[1],
        isDemo: true,
      },
    });
  }

  // ---- Marketplace demo listings ----
  const existingListings = await prisma.marketplaceListing.count();
  if (existingListings === 0) {
    await prisma.marketplaceListing.createMany({
      data: [
        {
          sellerId: youth.id,
          title: "Hand-stitched blouses (made to measure)",
          description:
            "Blouses stitched to measurement, cotton and silk fabrics. Bulk orders for functions accepted. Delivery within Warangal.",
          categoryId: (await cat("Handicrafts & Textiles")).id,
          price: "Rs. 450 - 900 per piece",
          village: "Khanapur",
          district: "Warangal",
          contactMethod: "phone",
          contactValue: "+919000000001",
          verification: "DEMO",
        },
        {
          sellerId: employer.id,
          title: "Farm-fresh free-range eggs (tray of 30)",
          description:
            "Free-range eggs from our cooperative farm. Wholesale rates for shops and hostels. Same-day collection or delivery in Warangal town.",
          categoryId: (await cat("Farm & Allied")).id,
          price: "Rs. 210 per tray",
          district: "Warangal",
          contactMethod: "phone",
          contactValue: "+919000000002",
          verification: "DEMO",
        },
      ],
    });
  }

  // ---- Sample application for demo youth (on first run) ----
  const appCount = await prisma.application.count({
    where: { userId: youth.id },
  });
  if (appCount === 0) {
    const first = createdOpps.find(
      (o) => o.title === "Tailoring Unit Stitcher",
    );
    if (first) {
      await prisma.application.create({
        data: {
          opportunityId: first.id,
          userId: youth.id,
          status: "UNDER_REVIEW",
          coverNote:
            "I have two years of tailoring experience at my family shop and can start immediately.",
        },
      });
    }
    const training = await prisma.trainingProgram.findUnique({
      where: { slug: slug("Basic Tailoring & Garment Construction") },
    });
    if (training) {
      await prisma.trainingEnrollment.create({
        data: {
          trainingProgramId: training.id,
          userId: youth.id,
          progress: 35,
        },
      });
    }
  }

  // ---- Notification demo ----
  const notifCount = await prisma.notification.count({
    where: { userId: youth.id },
  });
  if (notifCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: youth.id,
          title: "Welcome to RuralRise",
          body: "Complete your profile to unlock personalized job matches.",
          link: "/profile",
        },
        {
          userId: youth.id,
          title: "3 new matches near you",
          body: "New verified opportunities were posted in Warangal district.",
          link: "/opportunities",
        },
      ],
    });
  }

  console.log("Seed complete.");
  console.log(
    "Demo logins: youth@demo.ruralrise.in / employer@demo.ruralrise.in / admin@demo.ruralrise.in (password: Password123!)",
  );
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
