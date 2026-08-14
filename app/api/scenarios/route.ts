import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exportScenariosToJson } from '@/lib/sync';

export async function GET() {
  try {
    console.log('API: GET /api/scenarios triggered');
    const scenarios = await prisma.scenario.findMany({
      include: {
        options: {
          include: {
            requirements: {
              select: {
                uid: true
              }
            }
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { id: 'asc' }
      ]
    });

    console.log(`API: Found ${scenarios.length} scenarios in DB`);

    // Map to the expected JSON format for the frontend if necessary
    const formatted = scenarios.map(s => ({
      scenario_id: s.id,
      category: s.category,
      topic: s.topic,
      stimulus: s.stimulus,
      metric_question: s.metricQuestion,
      rationale: s.rationale,
      flagged: s.flagged,
      flagComment: s.flagComment,
      options: s.options.map(o => ({
        label: o.label,
        description: o.description,
        flagged: o.flagged,
        flagComment: o.flagComment,
        referenced_requirements: o.requirements.map(r => r.uid)
      }))
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('API Error in GET /api/scenarios:', error);
    return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

    for (const scenario of body) {
      await prisma.scenario.upsert({
        where: { id: scenario.scenario_id },
        update: {
          category: scenario.category,
          topic: scenario.topic,
          stimulus: scenario.stimulus,
          metricQuestion: scenario.metric_question,
          rationale: scenario.rationale || null,
          flagged: scenario.flagged || false,
          flagComment: scenario.flagComment || null,
        },
        create: {
          id: scenario.scenario_id,
          category: scenario.category,
          topic: scenario.topic,
          stimulus: scenario.stimulus,
          metricQuestion: scenario.metric_question,
          rationale: scenario.rationale || null,
          flagged: scenario.flagged || false,
          flagComment: scenario.flagComment || null,
        },
      });

      // Update options
      // Note: This is simplified. Ideally we would handle deletions/updates of options carefully.
      // For now, we clear and recreate for the scenario.
      await prisma.scenarioOption.deleteMany({ where: { scenarioId: scenario.scenario_id } });

      for (const option of scenario.options) {
        await prisma.scenarioOption.create({
          data: {
            scenarioId: scenario.scenario_id,
            label: option.label,
            description: option.description,
            flagged: option.flagged || false,
            flagComment: option.flagComment || null,
            requirements: {
              connect: option.referenced_requirements.map((uid: string) => ({ uid })),
            },
          },
        });
      }
    }

    const currentIds = body.map(s => s.scenario_id);
    await prisma.scenario.deleteMany({
      where: { id: { notIn: currentIds } }
    });

    await exportScenariosToJson();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving scenarios:', error);
    return NextResponse.json({
      error: 'Failed to save scenarios',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
