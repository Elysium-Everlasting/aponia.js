import {
  ArrowRightIcon,
  ClipboardCopyIcon,
  ColumnsIcon,
  FileIcon,
  FileSignatureIcon,
} from 'lucide-react'

import { BentoGrid, BentoGridItem } from './aceternity/bento-grid'

export function FeaturesGrid() {
  return (
    <BentoGrid className="max-w-4xl mx-auto">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          icon={item.icon}
          className={i === 3 || i === 6 ? 'md:col-span-2' : ''}
        />
      ))}
    </BentoGrid>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>
  )
}

const items = [
  {
    title: 'OAuth and OIDC',
    description:
      'Flexible API to define providers, and easy integration with external configurations',
    header: <Skeleton />,
    icon: <ClipboardCopyIcon className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: 'DIY',
    description: 'Full ownership and customization of your auth solution for any kind of project',
    header: <Skeleton />,
    icon: <FileIcon className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: 'Declarative Auth',
    description:
      'Define your request handlers for different providers, and the framework calls your methods.',
    header: <Skeleton />,
    icon: <FileSignatureIcon className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: 'Minimal and Modular',
    description: `Plugins require a minimal number of methods, and you can build your auth solution by extending the class or your framework.`,
    header: <Skeleton />,
    icon: <ArrowRightIcon className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: 'Extensible',
    description:
      'Integrations with external OAuth/OIDC configurations for fast setup and the same flexibility.',
    header: <Skeleton />,
    icon: <ColumnsIcon className="h-4 w-4 text-neutral-500" />,
  },
]
