import React from 'react';
import {
    Globe,
    Bot,
    Heart,
    Users,
    GraduationCap,
    DollarSign,
    Lock,
    Rocket,
    BarChart3,
    Search,
    Clock,
    CheckCircle,
    X,
    Target,
    Square,
    AlertTriangle,
    MessageCircle,
    Play,
    Pause,
    Plus,
    Minus,
    ChevronDown,
    ChevronUp,
    Settings,
    Database,
    Zap,
    Eye,
    Activity,
    TrendingUp,
    Shield,
    Lightbulb,
    BookOpen,
    Scale,
    Cpu,
    Network,
    Timer,
    Sparkles,
    Brain,
    Gauge,
    Layers,
    Grid3X3,
    MessageSquare,
    Users2,
    Megaphone,
    Mic,
    UserCircle,
    Crown,
    Gavel,
    Loader2,
    Circle,
    Save
} from 'lucide-react';

// Icon mapping for topics and general use
const iconMap = {
    // Topic icons
    'climate': Globe,
    'ai': Bot,
    'healthcare': Heart,
    'immigration': Users,
    'education': GraduationCap,
    'taxation': DollarSign,
    'privacy': Lock,
    'space': Rocket,
    
    // Action icons
    'analytics': BarChart3,
    'search': Search,
    'loading': Loader2,
    'success': CheckCircle,
    'error': X,
    'target': Target,
    'stop': Square,
    'warning': AlertTriangle,
    'message': MessageCircle,
    'play': Play,
    'pause': Pause,
    'add': Plus,
    'remove': Minus,
    'expand': ChevronDown,
    'collapse': ChevronUp,
    'settings': Settings,
    'save': Save,
    
    // Tech icons
    'database': Database,
    'performance': Zap,
    'monitor': Eye,
    'activity': Activity,
    'trending': TrendingUp,
    'security': Shield,
    'idea': Lightbulb,
    'fact': BookOpen,
    'balance': Scale,
    'ai-chip': Cpu,
    'network': Network,
    'timer': Timer,
    'enhance': Sparkles,
    'brain': Brain,
    'gauge': Gauge,
    'multi-debate': Grid3X3,
    'layers': Layers,
    'debate': MessageSquare,
    'group': Users2,
    'announce': Megaphone,
    'speak': Mic,
    
    // Agent personas
    'senator': Gavel,
    'reformer': Lightbulb,
    'citizen': UserCircle,
    'leader': Crown,
    
    // Stance indicators
    'against': X,
    'neutral': Circle,
    'support': CheckCircle
};

const Icon = ({ 
    name, 
    size = 16, 
    className = '', 
    color = 'currentColor',
    ...props 
}) => {
    const IconComponent = iconMap[name];
    
    if (!IconComponent) {
        console.warn(`Icon "${name}" not found in iconMap`);
        return null;
    }
    
    return (
        <IconComponent 
            size={size} 
            className={className}
            color={color}
            {...props}
        />
    );
};

export default Icon;
export { iconMap };
