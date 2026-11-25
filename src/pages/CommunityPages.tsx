import React, { useState } from 'react';
import {
  ArrowLeft,
  ChatCircleDots,
  EnvelopeSimple,
  PhoneCall,
  ShieldCheck,
  Users,
} from '@phosphor-icons/react';
import {
  FAQ_ITEMS,
  SERVER_INFO,
  SERVER_RULES,
  SERVER_TIMELINE,
  TEAM_MEMBERS,
} from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import { AppRoute } from '../components/Navbar';
import { RevealSection } from '../components/Reveal';

export function AboutPage({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 bg-[#07110B]">
      <div className="max-w-5xl mx-auto space-y-16">
        <section className="space-y-6">
          <p className="font-pixel caption-4 text-[#A3E635]">Established 2019</p>
          <h1 className="heading-2 sm:heading-1 hero-heading-gradient max-w-[680px]">
            Our Story and Mission
          </h1>
          <p className="body-3 text-[#9BAD9F] max-w-[680px]">
            IronCloudMC was founded in 2019 by HASAN as a private world for close friends. That
            first survival spawn evolved into a cross edition community built for permanence.
          </p>
        </section>

        <RevealSection className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SERVER_INFO.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-2 pixel-card-bevel"
            >
              <p className="font-mono-data heading-4 text-[#A3E635]">{stat.value}</p>
              <p className="caption-2 text-[#9BAD9F]">{stat.label}</p>
            </div>
          ))}
        </RevealSection>

        <RevealSection className="space-y-6">
          <h2 className="heading-4 text-[#E8F0E9]">Server Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SERVER_TIMELINE.map((entry) => (
              <div
                key={entry.year}
                className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-2 pixel-card-bevel"
              >
                <p className="font-mono-data caption-3 text-[#A3E635]">{entry.year}</p>
                <p className="body-6 text-[#9BAD9F]">{entry.event}</p>
              </div>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="rounded-3xl bg-[#0B1F12] border border-[#243C2A] p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pixel-card-bevel">
          <div className="space-y-2 max-w-[540px]">
            <h2 className="heading-5 text-[#E8F0E9]">The Iron Cloud Name</h2>
            <p className="body-6 text-[#9BAD9F]">
              Iron stands for strength and permanence, while Cloud reflects limitless creativity
              across every survival, skyblock, and faction realm.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/store')}
            className="py-2.5 px-4 rounded-lg bg-[#16A34A] text-[#041008] button-sm pixel-block-btn whitespace-nowrap shrink-0 transition-all duration-200 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
          >
            Explore Server Store
          </button>
        </RevealSection>
      </div>
    </div>
  );
}

export function TeamPage() {
  const groups = ['Management', 'Administration', 'Moderation'] as const;

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 bg-[#07110B]">
      <div className="max-w-5xl mx-auto space-y-12">
        <section className="space-y-4">
          <p className="font-pixel caption-4 text-[#A3E635]">Staff Roster</p>
          <h1 className="heading-2 sm:heading-1 hero-heading-gradient max-w-[680px]">
            Meet the Team Behind Iron Cloud MC
          </h1>
          <p className="body-3 text-[#9BAD9F] max-w-[680px]">
            Developers, administrators, and moderators maintaining fair play, custom plugins, and
            prompt store support.
          </p>
        </section>

        {groups.map((group) => {
          const members = TEAM_MEMBERS.filter((m) => m.group === group);
          return (
            <RevealSection key={group} className="space-y-4">
              <div className="flex items-center gap-3">
                <Users size={20} weight="bold" className="text-[#A3E635]" aria-hidden="true" />
                <h2 className="heading-5 text-[#E8F0E9]">{group} Team</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {members.map((member) => (
                  <article
                    key={member.name}
                    className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-3 pixel-card-bevel"
                  >
                    <p className="caption-4 text-[#A3E635]">{member.role}</p>
                    <h3 className="heading-6 text-[#E8F0E9]">{member.name}</h3>
                    <p className="body-6 text-[#9BAD9F]">{member.bio}</p>
                  </article>
                ))}
              </div>
            </RevealSection>
          );
        })}
      </div>
    </div>
  );
}

export function SupportPage() {
  const { profile, firebaseUser, getToken } = useAuth();
  const [minecraftUsername, setMinecraftUsername] = useState(profile?.minecraftUsername || '');
  const [email, setEmail] = useState(profile?.email || firebaseUser?.email || '');
  const [category, setCategory] = useState('Store Delivery');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  React.useEffect(() => {
    if (profile?.minecraftUsername && !minecraftUsername) {
      setMinecraftUsername(profile.minecraftUsername);
    }
    if ((profile?.email || firebaseUser?.email) && !email) {
      setEmail(profile?.email || firebaseUser?.email || '');
    }
  }, [profile, firebaseUser, minecraftUsername, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = minecraftUsername.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (cleanUser.length < 2) {
      setStatus('error');
      setFeedback('Enter your Minecraft username (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setStatus('error');
      setFeedback('Enter a valid email address.');
      return;
    }
    if (cleanSubject.length < 4) {
      setStatus('error');
      setFeedback('Enter a clear subject line (at least 4 characters).');
      return;
    }
    if (cleanMessage.length < 10) {
      setStatus('error');
      setFeedback('Describe your issue with at least 10 characters.');
      return;
    }

    setStatus('submitting');
    setFeedback('');

    try {
      const token = await getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          minecraftUsername: cleanUser,
          email: cleanEmail,
          category,
          subject: cleanSubject,
          message: cleanMessage,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ticket submission failed.');
      }
      setStatus('success');
      setFeedback(`Support ticket #${data.ticket.id} logged for ${cleanUser}.`);
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      setStatus('error');
      setFeedback(err instanceof Error ? err.message : 'Ticket submission failed. Try again.');
    }
  };

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 bg-[#07110B]">
      <div className="max-w-5xl mx-auto space-y-12">
        <section className="space-y-4">
          <p className="font-pixel caption-4 text-[#A3E635]">Support Center</p>
          <h1 className="heading-2 sm:heading-1 hero-heading-gradient max-w-[680px]">
            Help for Orders, Account Access, and Gameplay
          </h1>
          <p className="body-3 text-[#9BAD9F] max-w-[680px]">
            Reach our staff team via Discord, direct email, phone, or the support ticket form below.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href={SERVER_INFO.discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-3 transition-colors duration-200 ease-weighted hover:bg-[#14261A] hover:border-[#365C38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
          >
            <ChatCircleDots size={24} weight="bold" className="text-[#A3E635]" aria-hidden="true" />
            <h2 className="title-2 text-[#E8F0E9]">Discord Support</h2>
            <p className="body-6 text-[#9BAD9F]">
              Fastest response from active moderators and administrators.
            </p>
            <p className="font-mono-data caption-4 text-[#E8F0E9]">{SERVER_INFO.discordDisplay}</p>
          </a>

          <a
            href={`mailto:${SERVER_INFO.email}`}
            className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-3 transition-colors duration-200 ease-weighted hover:bg-[#14261A] hover:border-[#365C38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
          >
            <EnvelopeSimple size={24} weight="bold" className="text-[#A3E635]" aria-hidden="true" />
            <h2 className="title-2 text-[#E8F0E9]">Email Support</h2>
            <p className="body-6 text-[#9BAD9F]">
              Detailed billing or technical inquiries answered within 24 hours.
            </p>
            <p className="font-mono-data caption-4 text-[#E8F0E9]">{SERVER_INFO.email}</p>
          </a>

          <a
            href={`tel:${SERVER_INFO.phone}`}
            className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 space-y-3 transition-colors duration-200 ease-weighted hover:bg-[#14261A] hover:border-[#365C38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
          >
            <PhoneCall size={24} weight="bold" className="text-[#A3E635]" aria-hidden="true" />
            <h2 className="title-2 text-[#E8F0E9]">Phone Support</h2>
            <p className="body-6 text-[#9BAD9F]">
              Direct contact during business hours for urgent payment verification.
            </p>
            <p className="font-mono-data caption-4 text-[#E8F0E9]">{SERVER_INFO.phone}</p>
          </a>
        </section>

        <RevealSection className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-7 rounded-3xl bg-[#101D14] border border-[#243C2A] p-6 sm:p-8 space-y-5 pixel-card-bevel"
          >
            <h2 className="heading-5 text-[#E8F0E9]">Submit a Support Ticket</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="ticket-mc-user" className="caption-3 text-[#E8F0E9] block">
                  Minecraft Username
                </label>
                <input
                  id="ticket-mc-user"
                  type="text"
                  value={minecraftUsername}
                  onChange={(e) => setMinecraftUsername(e.target.value)}
                  placeholder="PlayerName"
                  className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="ticket-email" className="caption-3 text-[#E8F0E9] block">
                  Email Address
                </label>
                <input
                  id="ticket-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@example.com"
                  className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="ticket-category" className="caption-3 text-[#E8F0E9] block">
                  Topic
                </label>
                <select
                  id="ticket-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                >
                  <option value="Store Delivery">Store Delivery</option>
                  <option value="bKash or Nagad Verification">bKash or Nagad Verification</option>
                  <option value="Player Report">Player Report</option>
                  <option value="Technical Bug">Technical Bug</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="ticket-subject" className="caption-3 text-[#E8F0E9] block">
                  Subject
                </label>
                <input
                  id="ticket-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Order delivery check"
                  className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="ticket-message" className="caption-3 text-[#E8F0E9] block">
                Details
              </label>
              <textarea
                id="ticket-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Include your order code or bKash/Nagad transaction ID if reporting a store issue."
                className="w-full bg-[#0B1F12] border border-[#243C2A] rounded-lg px-3 py-2 body-6 text-[#E8F0E9] placeholder:text-[#728778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
              />
            </div>

            {feedback && (
              <p
                role={status === 'error' ? 'alert' : 'status'}
                className={`body-6 ${status === 'error' ? 'text-[#F87171]' : 'text-[#A3E635]'}`}
              >
                {feedback}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="py-2.5 px-4 rounded-lg bg-[#16A34A] text-[#041008] button-md pixel-block-btn transition-all duration-200 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
            >
              {status === 'submitting' ? 'Submitting Ticket' : 'Submit Support Ticket'}
            </button>
          </form>

          <div className="lg:col-span-5 space-y-4">
            <h2 className="heading-5 text-[#E8F0E9]">Common Answers</h2>
            {FAQ_ITEMS.slice(0, 4).map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-5 space-y-2"
              >
                <p className="title-4 text-[#E8F0E9]">{faq.question}</p>
                <p className="body-6 text-[#9BAD9F]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </div>
  );
}

export function LegalPage({
  type,
  onNavigate,
}: {
  type: 'privacy' | 'terms';
  onNavigate: (route: AppRoute) => void;
}) {
  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 bg-[#07110B]">
      <div className="max-w-3xl mx-auto space-y-8">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 body-5 text-[#9BAD9F] hover:text-[#E8F0E9] transition-colors duration-200"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to Home</span>
        </button>

        <h1 className="heading-2 text-[#E8F0E9]">
          {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
        </h1>

        <div className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 sm:p-8 space-y-6 body-6 text-[#E8F0E9]">
          {type === 'privacy' ? (
            <>
              <p>
                IRON CLOUD MC collects only the information needed to authenticate player accounts
                via Google Sign In, attach your Minecraft username, verify bKash or Nagad store
                transactions, and respond to support tickets.
              </p>
              <p>
                Order records, transaction IDs, sender phone numbers, and support messages are
                stored securely in our server database solely for fulfillment verification and
                customer support. We never sell or distribute player data to third parties.
              </p>
              <p>
                For data correction or removal requests, contact {SERVER_INFO.email} or open a
                ticket through the Support Center.
              </p>
            </>
          ) : (
            <>
              <p>
                All ranks, coin packages, and crate keys sold in the IRON CLOUD MC store are
                digital server items unlocked on {SERVER_INFO.ip} for your specified Java or
                Bedrock Minecraft username.
              </p>
              <p>
                Purchases are delivered once your bKash or Nagad transaction ID is verified. Because
                digital entitlements take effect immediately, completed deliveries are non
                refundable, except where a confirmed technical error prevents delivery.
              </p>
              <p>
                Players must follow server rules across Survival, Skyblock, Factions, and PvP
                realms. Account bans resulting from rule violations do not qualify for store
                refunds.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function RulesPage({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 bg-[#07110B]">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-4">
          <p className="font-pixel caption-4 text-[#A3E635]">Server Guidelines</p>
          <h1 className="heading-2 sm:heading-1 hero-heading-gradient max-w-[680px]">
            Community and Store Rules
          </h1>
          <p className="body-3 text-[#9BAD9F] max-w-[680px]">
            Clear conduct standards keep Survival, Skyblock, Factions, and PvP arenas fair for
            every Java and Bedrock player on {SERVER_INFO.ip}.
          </p>
        </div>

        <div className="space-y-4">
          {SERVER_RULES.map((rule) => (
            <article
              key={rule.code}
              className="rounded-2xl bg-[#101D14] border border-[#243C2A] p-6 flex flex-col sm:flex-row sm:items-start gap-4 pixel-card-bevel"
            >
              <div className="inline-flex items-center gap-2 shrink-0">
                <ShieldCheck size={20} weight="bold" className="text-[#A3E635]" aria-hidden="true" />
                <span className="font-mono-data caption-3 text-[#A3E635]">Rule {rule.code}</span>
              </div>
              <div className="space-y-2">
                <h2 className="title-2 text-[#E8F0E9]">{rule.title}</h2>
                <p className="body-6 text-[#9BAD9F]">{rule.detail}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-2xl bg-[#0B1F12] border border-[#243C2A] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="title-3 text-[#E8F0E9]">Need to report a rule violation or appeal?</p>
            <p className="body-6 text-[#9BAD9F]">
              Submit a tracked report via Support or speak directly with staff on Discord.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/support')}
              className="py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] button-sm pixel-block-btn hover:bg-[#22C55E]"
            >
              Open Support Center
            </button>
            <a
              href={SERVER_INFO.discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-sm hover:bg-[#1B3323]"
            >
              Discord Server
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <div className="pt-36 pb-24 px-4 sm:px-6 bg-[#07110B]">
      <div className="max-w-xl mx-auto rounded-3xl bg-[#101D14] border border-[#243C2A] p-8 sm:p-12 text-center space-y-6 pixel-card-bevel">
        <p className="font-pixel caption-3 text-[#A3E635]">404</p>
        <h1 className="heading-3 text-[#E8F0E9]">Page not found in this realm</h1>
        <p className="body-6 text-[#9BAD9F]">
          The route you requested does not exist on IRON CLOUD MC. Return to the homepage or
          browse the server store.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="py-2 px-3 rounded-lg bg-[#16A34A] text-[#041008] button-sm pixel-block-btn transition-all duration-200 ease-weighted hover:bg-[#22C55E] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
          >
            Return Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/store')}
            className="py-2 px-3 rounded-lg bg-[#14261A] border border-[#243C2A] text-[#E8F0E9] button-sm transition-colors duration-200 ease-weighted hover:bg-[#1B3323] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3E635]"
          >
            Open Store
          </button>
        </div>
      </div>
    </div>
  );
}
