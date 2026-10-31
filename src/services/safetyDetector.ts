import { SafetyAuditMetadata } from '../types';

interface SafetyRule {
  category: string;
  patterns: RegExp[];
  reason: string;
}

const SAFETY_RULES: SafetyRule[] = [
  // 1. Adult, Pornography, Sexually Explicit & NSFW Links
  {
    category: 'Sexually Explicit & Adult Content',
    reason: 'Safety guidelines strictly prohibit sexually explicit material, pornography, or links to adult sites.',
    patterns: [
      /\b(?:porn|pornography|xxx|nsfw|hentai|sex\s*video|porn\s*site|porn\s*link|erotic\s*link|camgirl|deepfake\s*porn|hardcore\s*porn|masturbat\w*|onlyfans\s*leaks?|incest|pedophil\w*|child\s*abuse|csam)\b/i,
      /\b(?:best|top|free|watch)\s+(?:porn|xxx|adult|sex)\s+(?:site|link|video|tube|stream)/i,
      /\b(?:give|send|show|find)\s+me\s+(?:a\s+)?(?:best\s+)?(?:porn|xxx|sex|adult)\s+(?:site|link|url)/i
    ]
  },
  // 2. Malware, Cyberattacks, Exploits & Hacking
  {
    category: 'Malware & Cyberattack Tools',
    reason: 'Safety guidelines prohibit creating malware, exploit scripts, ransomware, or tools for unauthorized computer intrusion.',
    patterns: [
      /\b(?:keylogger|ransomware|trojan\s*virus|ddos\s*attack|botnet\s*code|sql\s*injection\s*payload|bypass\s*authentication\s*exploit|hack\s*(?:into|someone'?s|an?)\s*(?:account|instagram|facebook|email|database|server|phone)|steal\s*(?:passwords?|credentials?|credit\s*cards?)|phishing\s*(?:page|template|email\s*payload)|cookie\s*stealer|wifi\s*deauther|cve-\d{4}-\d{4,}\s+exploit\s+code)\b/i,
      /\b(?:how\s+to\s+hack|write\s+an?\s+exploit|create\s+malware|crack\s+passwords?)\b/i
    ]
  },
  // 3. Weapons, Explosives & Dangerous Materials
  {
    category: 'Weapons & Explosives',
    reason: 'Safety guidelines prohibit manufacturing instructions for bombs, firearms, or lethal chemical/biological agents.',
    patterns: [
      /\b(?:how\s+to\s+make\s+a\s+bomb|build\s+(?:an?\s+)?explosive|synthesize\s+(?:ricin|sarin|anthrax|nerve\s*agent)|3d\s*print\s*(?:a\s+)?(?:ghost\s*gun|firearm)|pipe\s*bomb|molotov\s*cocktail\s*recipe|improvised\s*explosive\s*device|weaponize\s+anthrax)\b/i
    ]
  },
  // 4. Suicide & Self-Harm
  {
    category: 'Suicide & Self-Harm',
    reason: 'Safety guidelines prohibit assistance or instructions related to suicide or intentional self-harm.',
    patterns: [
      /\b(?:how\s+to\s+commit\s+suicide|ways\s+to\s+kill\s+myself|painless\s+suicide|how\s+to\s+hang\s+myself|how\s+to\s+slit\s+wrists?|lethal\s+dose\s+to\s+die)\b/i
    ]
  },
  // 5. Severe Violence, Terrorism & Kidnapping
  {
    category: 'Violence & Violent Extremism',
    reason: 'Safety guidelines prohibit terrorism, kidnapping, murder, assassination, or torture.',
    patterns: [
      /\b(?:how\s+to\s+assassinate|hire\s+a\s+hitman|plan\s+(?:a\s+)?(?:mass\s*shooting|terrorist\s*attack)|how\s+to\s+kidnap|torture\s+(?:someone|methods))\b/i
    ]
  },
  // 6. Illicit Controlled Substances Synthesis
  {
    category: 'Dangerous Controlled Substances',
    reason: 'Safety guidelines prohibit chemical synthesis procedures for illegal drugs and narcotics.',
    patterns: [
      /\b(?:how\s+to\s+(?:synthesize|cook|manufacture|make)\s+(?:methamphetamine|crystal\s*meth|fentanyl|heroin|lsd\s*at\s*home))\b/i
    ]
  }
];

/**
 * Evaluates whether a user query conforms to AI safety guidelines.
 * Returns 'strongly_supported' for safe queries or 'not_supported' for policy-violating prompts.
 */
export function auditSafetyGuidelines(query: string): SafetyAuditMetadata {
  const text = (query || '').trim();
  if (!text) {
    return {
      isSafe: true,
      status: 'strongly_supported',
      reason: 'Standard safe input'
    };
  }

  for (const rule of SAFETY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        return {
          isSafe: false,
          status: 'not_supported',
          category: rule.category,
          reason: rule.reason
        };
      }
    }
  }

  return {
    isSafe: true,
    status: 'strongly_supported',
    reason: 'Compliant with AI safety guidelines'
  };
}
