// Update Agent Profiles with Additional Stance Keys
import 'dotenv/config';
import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });

async function updateAgentStances() {
    try {
        await client.connect();
        console.log('🔌 Connected to Redis');

        // Define the agents to update
        const agents = ['senatorbot', 'reformerbot'];
        
        // Define default stances for new topics
        const defaultStances = {
            climate_policy: { senatorbot: 0.4, reformerbot: 0.9 },
            healthcare_policy: { senatorbot: 0.6, reformerbot: 0.8 },
            education_policy: { senatorbot: 0.5, reformerbot: 0.9 },
            immigration_policy: { senatorbot: 0.3, reformerbot: 0.8 },
            tax_policy: { senatorbot: 0.4, reformerbot: 0.9 },
            ai_policy: { senatorbot: 0.5, reformerbot: 0.7 },
            privacy_policy: { senatorbot: 0.6, reformerbot: 0.8 },
            space_policy: { senatorbot: 0.7, reformerbot: 0.6 }
        };

        for (const agentId of agents) {
            console.log(`\n📝 Updating ${agentId} profile...`);
            
            // Get current profile
            const profile = await client.json.get(`agent:${agentId}:profile`);
            
            if (!profile) {
                console.log(`❌ No profile found for ${agentId}`);
                continue;
            }

            console.log(`Current stances:`, Object.keys(profile.stance || {}));
            
            // Ensure stance object exists
            if (!profile.stance) {
                profile.stance = {};
            }

            // Add missing stance keys
            let updated = false;
            for (const [stanceKey, agentStances] of Object.entries(defaultStances)) {
                if (!profile.stance.hasOwnProperty(stanceKey)) {
                    profile.stance[stanceKey] = agentStances[agentId];
                    console.log(`  ✅ Added ${stanceKey}: ${agentStances[agentId]}`);
                    updated = true;
                } else {
                    console.log(`  ✓ ${stanceKey}: ${profile.stance[stanceKey]} (existing)`);
                }
            }

            if (updated) {
                // Update the profile
                await client.json.set(`agent:${agentId}:profile`, '$', profile);
                console.log(`✅ Updated ${agentId} profile with new stance keys`);
            } else {
                console.log(`✓ ${agentId} profile already up to date`);
            }
        }

        console.log('\n🎉 Agent stance updates completed!');
        
    } catch (error) {
        console.error('❌ Error updating agent stances:', error);
    } finally {
        await client.quit();
    }
}

// Run the update
updateAgentStances();
