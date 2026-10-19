import { Collapsible } from '@astryxdesign/core/Collapsible'
import { Icon } from '@astryxdesign/core/Icon'
import { List, ListItem } from '@astryxdesign/core/List'
import type { MarkdownSource } from '@astryxdesign/core/Markdown'
import { HStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

export function ChatSources({ sources }: { sources: Record<string, MarkdownSource> }) {
  const entries = Object.entries(sources)
  if (!entries.length) return null

  return <Collapsible defaultIsOpen={false} className="[&_.astryx-collapsible-trigger]:w-fit! [&_.astryx-collapsible-trigger]:min-h-10! [&_.astryx-collapsible-trigger]:gap-2! [&_.astryx-collapsible-trigger]:rounded-full! [&_.astryx-collapsible-trigger]:px-3! [&_.astryx-collapsible-trigger]:py-1! [&_.astryx-collapsible-trigger]:transition-colors [&_.astryx-collapsible-trigger:hover]:bg-neutral! [&_.astryx-collapsible-trigger]:text-secondary!"
    trigger={<HStack as="span" gap={2} vAlign="center">
      <HStack as="span" gap={0} aria-hidden="true" className="-space-x-2">
        {entries.slice(0, 3).map(([id]) => <HStack as="span" key={id} hAlign="center" vAlign="center" className="h-7 w-7 shrink-0 rounded-full bg-neutral ring-2 ring-surface">
          <Text type="supporting" weight="semibold" className="text-xs! tabular-nums">{id}</Text>
        </HStack>)}
      </HStack>
      <Text type="supporting" color="secondary">{entries.length} {entries.length === 1 ? 'source' : 'sources'}</Text>
    </HStack>}>
    <List density="compact" className="mt-2 max-w-lg rounded-xl border border-border" aria-label="Answer sources">
      {entries.map(([id, source]) => <ListItem key={id} label={source.title ?? `Source ${id}`}
        description={source.url === '/resume_rashin.pdf' ? 'Résumé · PDF' : 'Portfolio'}
        href={source.url ?? '/'} target="_blank"
        startContent={<HStack hAlign="center" vAlign="center" className="h-8 w-8 shrink-0 rounded-full bg-neutral"><Text type="supporting" color="secondary" className="tabular-nums">{id}</Text></HStack>}
        endContent={<Icon icon="externalLink" size="sm" color="secondary" />} />)}
    </List>
  </Collapsible>
}
