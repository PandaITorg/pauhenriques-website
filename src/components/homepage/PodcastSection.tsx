'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { FaSpotify, FaApple, FaPlay } from 'react-icons/fa6';
import { FaHeadphones } from 'react-icons/fa';
import podcastCover from '@/assets/de-toxica-a-sin-toxicos.webp';

interface Episode {
  number: string;
  title: string;
  duration?: string;
  spotifyLink: string;
  applePodcastLink: string;
}

const SHOW_SPOTIFY_URL = 'https://open.spotify.com/show/6eMZqxyHUtW46yJd0Et4uw';
const SHOW_APPLE_URL =
  'https://podcasts.apple.com/us/podcast/de-t%C3%B3xica-a-sin-t%C3%B3xicos/id1567244331';

// Fallback used only when the RSS feed fetch fails (offline build, transient).
const FALLBACK_EPISODES: Episode[] = [
  {
    number: '11',
    title: 'Mi experiencia familiar con el Earthing',
    duration: '32 min',
    spotifyLink: 'https://open.spotify.com/episode/6eMZqxyHUtW46yJd0Et4uw',
    applePodcastLink: SHOW_APPLE_URL,
  },
  {
    number: '10',
    title: 'El veneno silencioso que te estás comiendo todos los días',
    duration: '41 min',
    spotifyLink: 'https://open.spotify.com/episode/5R0eOglaAltHGjnenJHK1C',
    applePodcastLink:
      'https://podcasts.apple.com/us/podcast/episodio-10-el-veneno-silencioso-que-te-est%C3%A1s/id1567244331?i=1000533922680',
  },
  {
    number: '09',
    title: 'Conoce los biorritmos de tu cuerpo y aplícalos a tu favor',
    duration: '28 min',
    spotifyLink: 'https://open.spotify.com/episode/0228CedbhkVhM6E9g4xG8C',
    applePodcastLink:
      'https://podcasts.apple.com/us/podcast/episodio-9-conoce-los-biorritmos-de-tu-cuerpo-y/id1567244331?i=1000530979938',
  },
];

interface PodcastSectionProps {
  episodes?: Episode[];
}

export default function PodcastSection({ episodes }: PodcastSectionProps = {}) {
  const list = episodes && episodes.length > 0 ? episodes : FALLBACK_EPISODES;
  const sectionRef = useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.15 });

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-28"
      style={{ backgroundColor: 'var(--color-surface-card)' }}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-12 md:gap-16 lg:gap-20 items-start">
          {/* ── Left: cover art with offset caramel frame ── */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -32 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm mx-auto md:mx-0 md:sticky md:top-24"
          >
            {/* Offset caramel frame */}
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 0.45 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute pointer-events-none rounded-2xl"
              style={{
                top: '14px',
                right: '14px',
                bottom: '-14px',
                left: '-14px',
                border: '2px solid var(--color-primary)',
              }}
            />

            <div
              className="relative aspect-square overflow-hidden rounded-2xl shadow-2xl"
              style={{ backgroundColor: 'var(--color-warm-800)' }}
            >
              <Image
                src={podcastCover}
                alt="De Tóxica a Sin Tóxicos — cover art"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 80vw, 30vw"
                priority={false}
              />
              {/* Soft gradient corner */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(166,138,99,0.10) 0%, transparent 60%)',
                }}
              />
            </div>

            {/* Streaming chips below cover */}
            <div className="mt-7 flex items-center justify-center md:justify-start gap-3">
              <a
                href={SHOW_SPOTIFY_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Escuchar en Spotify"
                className="flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'rgba(193,196,167,0.08)',
                  border: '1px solid rgba(193,196,167,0.18)',
                  color: 'var(--color-text-main)',
                }}
              >
                <FaSpotify className="w-5 h-5" />
              </a>
              <a
                href={SHOW_APPLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Escuchar en Apple Podcasts"
                className="flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'rgba(193,196,167,0.08)',
                  border: '1px solid rgba(193,196,167,0.18)',
                  color: 'var(--color-text-main)',
                }}
              >
                <FaApple className="w-5 h-5" />
              </a>
            </div>
          </motion.div>

          {/* ── Right: heading + episode list ── */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 32 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-primary)' }}
            >
              <FaHeadphones className="w-3.5 h-3.5" />
              Podcast
            </span>
            <h2
              className="font-cormorant font-medium leading-[1.1] mb-4"
              style={{
                color: 'var(--color-text-main)',
                fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
              }}
            >
              De{' '}
              <span
                className="font-dancing-script italic"
                style={{
                  color: 'var(--color-primary)',
                  fontSize: '1.1em',
                  fontWeight: 400,
                }}
              >
                Tóxica
              </span>{' '}
              a Sin Tóxicos
            </h2>
            <p
              className="mb-10 leading-relaxed font-sans max-w-lg"
              style={{ color: 'var(--color-text-main)', opacity: 0.7 }}
            >
              Conversaciones reales sobre salud, bienestar y vida sin tóxicos.
              Acompañada de mi esposo, invitados especiales y expertos en cada tema.
            </p>

            {/* Episode list */}
            <div className="space-y-3 mb-8">
              {list.map((ep, i) => (
                <EpisodeCard key={`${ep.number}-${i}`} episode={ep} index={i} inView={inView} />
              ))}
            </div>

            <Link
              href="/podcast"
              className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              Ver todos los episodios
              <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function EpisodeCard({
  episode,
  index,
  inView,
}: {
  episode: Episode;
  index: number;
  inView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.6, delay: 0.3 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: 'rgba(61, 74, 48, 0.45)',
        border: '1px solid rgba(166,138,99,0.15)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(166,138,99,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(166,138,99,0.15)';
      }}
    >
      {/* Play / number circle */}
      <a
        href={episode.spotifyLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Escuchar episodio ${episode.number}: ${episode.title}`}
        className="relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-105"
        style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
      >
        <span className="font-cormorant font-semibold text-base group-hover:opacity-0 transition-opacity duration-200">
          {episode.number}
        </span>
        <FaPlay
          className="absolute w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ marginLeft: '2px' }}
        />
      </a>

      {/* Title + duration */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
          style={{ color: 'var(--color-primary)' }}
        >
          Ep · {episode.number}
          {episode.duration && <span className="opacity-60"> · {episode.duration}</span>}
        </p>
        <h3
          className="font-cormorant font-medium leading-snug line-clamp-2"
          style={{
            color: 'var(--color-text-main)',
            fontSize: 'clamp(1rem, 1.4vw, 1.15rem)',
          }}
        >
          {episode.title}
        </h3>
      </div>

      {/* Streaming icons */}
      <div className="shrink-0 flex items-center gap-1.5">
        <a
          href={episode.spotifyLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Spotify"
          className="p-2 rounded-full transition-colors"
          style={{ color: 'var(--color-text-main)', opacity: 0.5 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.color = '#1DB954';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.5';
            e.currentTarget.style.color = 'var(--color-text-main)';
          }}
        >
          <FaSpotify className="w-4 h-4" />
        </a>
        <a
          href={episode.applePodcastLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Apple Podcasts"
          className="p-2 rounded-full transition-colors"
          style={{ color: 'var(--color-text-main)', opacity: 0.5 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.5';
          }}
        >
          <FaApple className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}
