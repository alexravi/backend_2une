import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create global application steps (reused across opportunities)
  const resumeStep = await prisma.applicationStep.upsert({
    where: { id: 'step-resume' },
    create: {
      id: 'step-resume',
      type: 'RESUME',
      name: 'Resume',
      isCore: true,
      sortOrder: 1,
    },
    update: {},
  });
  const personalIntroStep = await prisma.applicationStep.upsert({
    where: { id: 'step-personal-intro' },
    create: {
      id: 'step-personal-intro',
      type: 'PERSONAL_INTRODUCTION',
      name: 'Personal Introduction',
      isCore: true,
      sortOrder: 2,
    },
    update: {},
  });
  const workAuthStep = await prisma.applicationStep.upsert({
    where: { id: 'step-work-auth' },
    create: {
      id: 'step-work-auth',
      type: 'WORK_AUTHORIZATION',
      name: 'Work Authorization',
      isCore: false,
      sortOrder: 3,
    },
    update: {},
  });

  const stepIds = [resumeStep.id, personalIntroStep.id, workAuthStep.id];

  // Sample opportunities (from the design reference)
  const opportunitiesData = [
    { title: 'Frontend Engineer', payMin: 70, payMax: 150, bounty: 600, employmentType: 'PART_TIME' as const, hiredThisMonth: null },
    { title: 'Machine Learning Engineer', payMin: 100, payMax: 120, bounty: 480, employmentType: 'FULL_TIME' as const, hiredThisMonth: 73 },
    { title: 'Financial Services Expert', payMin: 90, payMax: 105, bounty: 500, employmentType: 'PART_TIME' as const, hiredThisMonth: null },
    { title: 'Software Engineer III', payMin: 75, payMax: 105, bounty: 420, employmentType: 'FULL_TIME' as const, hiredThisMonth: null },
    { title: 'Data Analyst I', payMin: 55, payMax: 75, bounty: 300, employmentType: 'PART_TIME' as const, hiredThisMonth: null },
    { title: 'Project Manager I', payMin: 35, payMax: 50, bounty: 200, employmentType: 'PART_TIME' as const, hiredThisMonth: null },
    { title: 'Software Engineer II', payMin: 70, payMax: 95, bounty: 380, employmentType: 'FULL_TIME' as const, hiredThisMonth: null },
    { title: 'Cybersecurity Expert (OSCP Required)', payMin: 100, payMax: 100, bounty: 400, employmentType: 'CONTRACT' as const, hiredThisMonth: null },
    { title: 'Pharmacists', payMin: 90, payMax: 150, bounty: 600, employmentType: 'PART_TIME' as const, hiredThisMonth: 61 },
    { title: 'Fraud QA Analyst - India', payMin: 10, payMax: 11, bounty: 200, employmentType: 'PART_TIME' as const, hiredThisMonth: 1 },
    { title: 'Australian Legal Expert', payMin: 120, payMax: 140, bounty: 560, employmentType: 'CONTRACT' as const, hiredThisMonth: 7 },
    { title: 'Technical Program Manager IV', payMin: 75, payMax: 105, bounty: 420, employmentType: 'FULL_TIME' as const, hiredThisMonth: null },
    { title: 'Project Manager III', payMin: 60, payMax: 85, bounty: 340, employmentType: 'PART_TIME' as const, hiredThisMonth: null },
    { title: 'Technical Program Manager III', payMin: 105, payMax: 140, bounty: 560, employmentType: 'FULL_TIME' as const, hiredThisMonth: null },
    { title: 'Software Engineer III (Backend)', payMin: 80, payMax: 110, bounty: 440, employmentType: 'FULL_TIME' as const, hiredThisMonth: null },
  ];

  const defaultTaskDetails = {
    jobDescription: 'We are looking for experienced professionals to contribute to AI-driven systems and evaluations.',
    keyResponsibilities: JSON.stringify([
      'Review and critique AI-generated prompts, responses, and tools.',
      'Develop algorithms and software concepts for technical accuracy.',
      'Provide structured feedback on solution quality and clarity.',
      'Tag and organize content by topic, difficulty, or purpose.',
      'Support benchmarking efforts to assess model capabilities.',
    ]),
    minimumQualifications: JSON.stringify([
      '2+ years of experience in software engineering, technical research, or applications development.',
      'Degree in Software Engineering, Computer Science, or related field (Bachelor\'s minimum).',
      'Strong proficiency in languages like Python, JavaScript, Java, or C++.',
      'Experience with debugging, testing, and validating code.',
      'Comfortable with technical writing and attention to detail.',
    ]),
    locationRequirements: JSON.stringify(['USA', 'CAN']),
    projectTimeline: JSON.stringify([
      'Start Date: Immediate',
      'Duration: 1-2 months',
      'Commitment: Part-time (15-25 hours/week, flexibility up to 40 hours/week).',
    ]),
    applicationProcess: JSON.stringify([
      'Upload your Resume',
      'Attend a 45-minute conversation and interview',
      'Follow-up communication',
    ]),
    contactPaymentTerms: 'Independent contractor. Fully remote. Payments are weekly via Stripe or Wise based on services rendered.',
    aboutCompany: '2une partners with leading teams to transfer human expertise into training and enhancing AI systems.',
  };

  const existingCount = await prisma.opportunity.count();
  if (existingCount === 0) {
    for (const opp of opportunitiesData) {
      await prisma.opportunity.create({
        data: {
          title: opp.title,
          payMin: opp.payMin,
          payMax: opp.payMax,
          bounty: opp.bounty,
          employmentType: opp.employmentType,
          isRemote: true,
          postedBy: '2une',
          hiredThisMonth: opp.hiredThisMonth,
          ...defaultTaskDetails,
          steps: {
            create: stepIds.map((applicationStepId) => ({ applicationStepId })),
          },
        },
      });
    }
    console.log(`Created ${opportunitiesData.length} opportunities with application steps.`);
  } else {
    const allOpps = await prisma.opportunity.findMany({ include: { steps: true } });
    for (const opp of allOpps) {
      if (opp.steps.length === 0) {
        await prisma.opportunityStep.createMany({
          data: stepIds.map((applicationStepId) => ({
            opportunityId: opp.id,
            applicationStepId,
          })),
        });
      }
    }
    console.log('Application steps linked to existing opportunities.');
    // Backfill task detail fields for existing opportunities that don't have them
    const updated = await prisma.opportunity.updateMany({
      where: { jobDescription: null },
      data: defaultTaskDetails,
    });
    if (updated.count > 0) {
      console.log(`Backfilled task details for ${updated.count} existing opportunities.`);
    }
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
