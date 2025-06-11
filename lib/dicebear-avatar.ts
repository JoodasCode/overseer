/**
 * DiceBear Croodles Avatar Generator
 * Generates unique, hand-drawn style avatars for AI agents
 * Based on https://www.dicebear.com/styles/croodles/
 */

export interface AvatarOptions {
  seed?: string
  size?: number
  backgroundColor?: string[]
  flip?: boolean
  rotate?: number
  scale?: number
}

export interface CroodlesOptions extends AvatarOptions {
  baseColor?: string[]
  beard?: string[]
  beardProbability?: number
  eyes?: string[]
  face?: string[]
  mouth?: string[]
  mustache?: string[]
  mustacheProbability?: number
  nose?: string[]
  top?: string[]
  topColor?: string[]
}

/**
 * Generate a DiceBear Croodles avatar URL for an agent
 */
export function generateAgentAvatar(
  agentName: string, 
  role: string, 
  options: CroodlesOptions = {}
): string {
  const baseUrl = 'https://api.dicebear.com/9.x/croodles/svg'
  
  // Use agent name + role as seed for consistency
  const seed = options.seed || `${agentName}-${role}`.toLowerCase().replace(/\s+/g, '-')
  
  // Default options optimized for professional AI agents
  const params = new URLSearchParams({
    seed,
    size: (options.size || 100).toString(),
    backgroundColor: (options.backgroundColor || ['transparent']).join(','),
    flip: (options.flip || false).toString(),
    rotate: (options.rotate || 0).toString(),
    scale: (options.scale || 100).toString(),
    
    // Croodles-specific options for professional look
    beardProbability: (options.beardProbability || 30).toString(),
    mustacheProbability: (options.mustacheProbability || 20).toString(),
    
    // Professional color palette
    baseColor: (options.baseColor || ['ffb3ba', 'ffdfba', 'ffffba', 'baffc9', 'bae1ff']).join(','),
    topColor: (options.topColor || ['4a5568', '2d3748', '1a202c', '553c9a', '805ad5']).join(','),
  })
  
  // Add specific options if provided
  if (options.eyes) params.set('eyes', options.eyes.join(','))
  if (options.face) params.set('face', options.face.join(','))
  if (options.mouth) params.set('mouth', options.mouth.join(','))
  if (options.nose) params.set('nose', options.nose.join(','))
  if (options.top) params.set('top', options.top.join(','))
  if (options.beard) params.set('beard', options.beard.join(','))
  if (options.mustache) params.set('mustache', options.mustache.join(','))
  
  return `${baseUrl}?${params.toString()}`
}

/**
 * Generate role-specific avatar configurations
 */
export function getRoleBasedAvatarConfig(role: string): CroodlesOptions {
  const roleConfigs: Record<string, CroodlesOptions> = {
    'Strategic Coordinator': {
      baseColor: ['e6f3ff'], // Light blue
      topColor: ['2563eb', '1d4ed8'], // Professional blue
      eyes: ['open', 'wink'],
      mouth: ['smile', 'serious'],
      beardProbability: 40,
    },
    'Visual Assistant': {
      baseColor: ['fef3e2'], // Warm cream
      topColor: ['f59e0b', 'ea580c'], // Creative orange
      eyes: ['happy', 'wink'],
      mouth: ['smile', 'laughing'],
      beardProbability: 20,
    },
    'Internal Liaison': {
      baseColor: ['f0fdf4'], // Light green
      topColor: ['16a34a', '15803d'], // Professional green
      eyes: ['open', 'happy'],
      mouth: ['smile', 'talking'],
      beardProbability: 30,
    },
    'Data Analyst': {
      baseColor: ['faf5ff'], // Light purple
      topColor: ['9333ea', '7c3aed'], // Analytical purple
      eyes: ['open', 'squint'],
      mouth: ['serious', 'smile'],
      beardProbability: 25,
    },
    'Support Coordinator': {
      baseColor: ['fef2f2'], // Light red/pink
      topColor: ['dc2626', 'b91c1c'], // Supportive red
      eyes: ['happy', 'open'],
      mouth: ['smile', 'laughing'],
      beardProbability: 35,
    },
  }
  
  return roleConfigs[role] || {
    baseColor: ['f8fafc'], // Default light gray
    topColor: ['64748b', '475569'], // Default slate
    beardProbability: 30,
  }
}

/**
 * Generate avatar for a specific agent template
 */
export function generateTemplateAvatar(agentTemplate: string): string {
  const templates: Record<string, { name: string; role: string; options?: CroodlesOptions }> = {
    alex: {
      name: 'Alex',
      role: 'Strategic Coordinator',
      options: {
        seed: 'alex-strategic-coordinator',
        ...getRoleBasedAvatarConfig('Strategic Coordinator'),
      }
    },
    dana: {
      name: 'Dana',
      role: 'Visual Assistant',
      options: {
        seed: 'dana-visual-assistant',
        ...getRoleBasedAvatarConfig('Visual Assistant'),
      }
    },
    jamie: {
      name: 'Jamie',
      role: 'Internal Liaison',
      options: {
        seed: 'jamie-internal-liaison',
        ...getRoleBasedAvatarConfig('Internal Liaison'),
      }
    },
    riley: {
      name: 'Riley',
      role: 'Data Analyst',
      options: {
        seed: 'riley-data-analyst',
        ...getRoleBasedAvatarConfig('Data Analyst'),
      }
    },
    toby: {
      name: 'Toby',
      role: 'Support Coordinator',
      options: {
        seed: 'toby-support-coordinator',
        ...getRoleBasedAvatarConfig('Support Coordinator'),
      }
    },
  }
  
  const template = templates[agentTemplate.toLowerCase()]
  if (!template) {
    throw new Error(`Unknown agent template: ${agentTemplate}`)
  }
  
  return generateAgentAvatar(template.name, template.role, template.options)
}

/**
 * Get avatar URL with fallback
 */
export function getAgentAvatarUrl(agent: { name: string; role: string; avatar_url?: string }): string {
  // If agent already has a DiceBear URL, return it
  if (agent.avatar_url?.includes('api.dicebear.com')) {
    return agent.avatar_url
  }
  
  // Generate new DiceBear avatar
  return generateAgentAvatar(agent.name, agent.role, getRoleBasedAvatarConfig(agent.role))
} 