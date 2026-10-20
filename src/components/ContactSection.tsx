import { useState, type FormEvent } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { Grid } from '@astryxdesign/core/Grid'
import { VStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { TextArea } from '@astryxdesign/core/TextArea'
import { useMediaQuery } from '@astryxdesign/core/hooks'
import { SectionTitle } from './SectionTitle'
import { trackEvent } from '../lib/analytics'

export function ContactSection() {
  const mobile = useMediaQuery('(max-width: 639px)')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [draftOpened, setDraftOpened] = useState(false)
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  function handleSubmit(event: FormEvent<HTMLElement>) {
    event.preventDefault()
    setAttempted(true)
    if (!name.trim() || !validEmail || !message.trim()) return
    trackEvent('contact_draft_opened')
    const subject = encodeURIComponent(`Portfolio enquiry from ${name.trim()}`)
    const body = encodeURIComponent(`${message.trim()}\n\nFrom: ${name.trim()}\nEmail: ${email.trim()}`)
    window.location.href = `mailto:rashinkp001@gmail.com?subject=${subject}&body=${body}`
    setDraftOpened(true)
  }

  return (
    <VStack as="section" id="contact" gap={5} hAlign="center" className="min-w-0 py-10 md:py-16">
      <SectionTitle>Let’s talk</SectionTitle>
      <VStack as="form" aria-label="Contact Rashin" onSubmit={handleSubmit} gap={4} maxWidth={mobile ? 408 : 720} paddingInline={mobile ? 2 : 0} data-reveal="contact-form" className="w-full min-w-0 [&_input]:rounded-none [&_textarea]:rounded-xl">
        <Grid columns={2} gap={4} className="grid-cols-1! sm:grid-cols-2!">
          <TextInput label="Your name" placeholder="Your Name" htmlName="name" value={name} onChange={setName} size="lg" className="min-h-12!" isRequired isLabelHidden status={attempted && !name.trim() ? { type: 'error', message: 'Please enter your name.' } : undefined} />
          <TextInput label="Email address" placeholder="Email Address" htmlName="email" type="email" value={email} onChange={setEmail} size="lg" className="min-h-12!" isRequired isLabelHidden status={attempted && !validEmail ? { type: 'error', message: 'Please enter a valid email address.' } : undefined} />
        </Grid>
        <TextArea label="Message" placeholder="Message" htmlName="message" value={message} onChange={setMessage} rows={4} size="lg" isRequired isLabelHidden status={attempted && !message.trim() ? { type: 'error', message: 'Please add a message.' } : undefined} />
        <Button label="Send ↗" type="submit" variant="primary" size="lg" width="100%" className="min-h-12! rounded-xl!" />
        <Text type="supporting" color="secondary" justify="center" role="status">{draftOpened ? 'Send the prepared draft in your email app.' : 'Opens your email app with a ready-to-send draft.'}</Text>
      </VStack>
    </VStack>
  )
}
