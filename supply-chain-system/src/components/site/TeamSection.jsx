/**
 * TeamSection.jsx — Dravix SCM Premium Team Section
 * Images loaded from /team/ (public directory).
 * No modifications needed after replacing /public/team/*.jpg with real photos.
 */
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";


import { Section, SectionHead, EASE_EXPO } from "./LandingEngine";

/* ─── LinkedIn SVG (inline — Linkedin not available in this lucide-react version) ── */
function LinkedinIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}


/* ─── Team data ──────────────────────────────────────────────────────────── */
const TEAM = [
  {
    name: "Dharun Hareesh G",
    role: "Founder • AI & Full Stack Developer",
    badge: "Founder",
    image: "/team/dharun.jpg",
    linkedin: "https://www.linkedin.com/in/dharun-hareesh/",
    description:
      "Architect and lead developer of Dravix SCM, responsible for Artificial Intelligence, Spring Boot, React, Intelligent OCR, KYC Verification, Trust Scoring, Logistics Intelligence, Market Price Prediction, AI Dispatch Optimization, and complete system architecture.",
    rgb: "16,185,129",
  },
  {
    name: "Shanmugapriyan S",
    role: "Backend Developer",
    badge: "Co-founder",
    image: "/team/member2.jpg",
    linkedin: "https://www.linkedin.com/in/shanmugapriyan-s-672477412/",
    description:
      "Develops scalable backend services, REST APIs, authentication, database architecture, warehouse workflows, logistics services, and enterprise business logic.",
    rgb: "6,182,212",
  },
  {
    name: "Rajesh Kanna K",
    role: "Frontend & UI/UX Developer",
    badge: "Co-founder",
    image: "/team/member3.jpg",
    linkedin: "https://www.linkedin.com/in/rajesh-kanna-k-251467-/",
    description:
      "Designs premium user experiences, responsive interfaces, dashboards, animations, React components, and modern enterprise UI for Dravix SCM.",
    rgb: "139,92,246",
  },
];

/* ─── Animation variants ─────────────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: EASE_EXPO },
  },
};

/* ─── Individual card ────────────────────────────────────────────────────── */
function TeamCard({ member, index }) {
  const prefersReducedMotion = useReducedMotion();
  const [imgError, setImgError] = useState(false);

  const floatTransition = prefersReducedMotion
    ? {}
    : {
      y: { duration: 3.2 + index * 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
    };

  const floatAnimate = prefersReducedMotion
    ? {}
    : { y: [0, -8, 0] };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={prefersReducedMotion ? {} : {
        y: -10,
        transition: { type: "spring", stiffness: 280, damping: 20 },
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `rgba(${member.rgb},0.45)`;
        e.currentTarget.style.boxShadow = `0 24px 64px rgba(${member.rgb},0.12), 0 0 0 1px rgba(${member.rgb},0.1)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)";
      }}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "40px 32px 36px",
        borderRadius: 24,
        background: "rgba(9,14,22,0.75)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        overflow: "hidden",
        transition: "border-color 0.3s, box-shadow 0.3s",
        cursor: "default",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute",
        inset: "0 0 auto",
        height: 1,
        background: `linear-gradient(90deg, transparent, rgba(${member.rgb},0.7), transparent)`,
        pointerEvents: "none",
      }} />

      {/* Ambient corner glow */}
      <div style={{
        position: "absolute",
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: "50%",
        background: `rgba(${member.rgb},0.06)`,
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: -40,
        left: -40,
        width: 140,
        height: 140,
        borderRadius: "50%",
        background: `rgba(${member.rgb},0.04)`,
        filter: "blur(50px)",
        pointerEvents: "none",
      }} />

      {/* Role badge */}
      <div style={{
        position: "absolute",
        top: 20,
        right: 20,
        padding: "4px 12px",
        borderRadius: 999,
        background: `rgba(${member.rgb},0.1)`,
        border: `1px solid rgba(${member.rgb},0.28)`,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: `rgb(${member.rgb})`,
      }}>
        {member.badge}
      </div>

      {/* Profile image — floating */}
      <motion.div
        animate={floatAnimate}
        transition={floatTransition}
        style={{ position: "relative", marginBottom: 24, flexShrink: 0 }}
      >
        {/* Glow ring */}
        <div style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          background: `conic-gradient(from 0deg, rgba(${member.rgb},0.6), rgba(${member.rgb},0.1), rgba(${member.rgb},0.6))`,
          filter: "blur(2px)",
          animation: "team-rotate 6s linear infinite",
        }} />
        {/* Image container */}
        <motion.div
          whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          style={{
            position: "relative",
            width: 180,
            height: 180,
            borderRadius: "50%",
            overflow: "hidden",
            border: `3px solid rgba(${member.rgb},0.55)`,
            boxShadow: `0 0 28px rgba(${member.rgb},0.22), 0 0 0 2px rgba(${member.rgb},0.1)`,
            background: `rgba(${member.rgb},0.06)`,
          }}
        >
          {!imgError ? (
            <img
              src={member.image}
              alt={member.name}
              loading="lazy"
              onError={() => setImgError(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            /* Fallback initials avatar if image fails to load */
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 800,
              color: `rgb(${member.rgb})`,
              background: `rgba(${member.rgb},0.08)`,
              letterSpacing: "-0.03em",
            }}>
              {member.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Name */}
      <h3 style={{
        margin: "0 0 6px",
        fontSize: "clamp(1.05rem, 2vw, 1.2rem)",
        fontWeight: 800,
        color: "#f8fafc",
        letterSpacing: "-0.025em",
        lineHeight: 1.2,
      }}>
        {member.name}
      </h3>

      {/* Role */}
      <p style={{
        margin: "0 0 18px",
        fontSize: 13,
        fontWeight: 600,
        color: `rgb(${member.rgb})`,
        letterSpacing: "0.01em",
      }}>
        {member.role}
      </p>

      {/* Divider */}
      <div style={{
        width: 40,
        height: 1.5,
        borderRadius: 999,
        background: `rgba(${member.rgb},0.4)`,
        marginBottom: 18,
      }} />

      {/* Description */}
      <p style={{
        margin: "0 0 28px",
        fontSize: 14,
        color: "#94a3b8",
        lineHeight: 1.7,
        flex: 1,
      }}>
        {member.description}
      </p>

      {/* LinkedIn button */}
      <motion.a
        href={member.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={prefersReducedMotion ? {} : {
          scale: 1.05,
          boxShadow: "0 0 20px rgba(10,102,194,0.45)",
        }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 22px",
          borderRadius: 12,
          background: "rgba(10,102,194,0.12)",
          border: "1px solid rgba(10,102,194,0.3)",
          color: "#60a5fa",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
          letterSpacing: "0.01em",
          transition: "background 0.22s, border-color 0.22s, color 0.22s",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(10,102,194,0.22)";
          e.currentTarget.style.borderColor = "rgba(10,102,194,0.55)";
          e.currentTarget.style.color = "#93c5fd";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "rgba(10,102,194,0.12)";
          e.currentTarget.style.borderColor = "rgba(10,102,194,0.3)";
          e.currentTarget.style.color = "#60a5fa";
        }}
      >
        <LinkedinIcon size={15} />
        LinkedIn
      </motion.a>
    </motion.div>
  );
}

/* ─── Section ────────────────────────────────────────────────────────────── */
export default function TeamSection() {
  return (
    <Section id="team" style={{ position: "relative" }}>
      {/* Large ambient blobs */}
      <div style={{
        position: "absolute", left: "50%", top: 60, zIndex: 0,
        width: 700, height: 500, borderRadius: "50%",
        background: "rgba(16,185,129,0.04)",
        filter: "blur(200px)",
        transform: "translateX(-50%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", right: -80, bottom: 40, zIndex: 0,
        width: 360, height: 360, borderRadius: "50%",
        background: "rgba(139,92,246,0.04)",
        filter: "blur(160px)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <SectionHead
          eyebrow="Meet Our Team"
          title="The Minds Behind Dravix SCM"
          desc="The passionate minds behind Dravix SCM, building AI-powered solutions that transform Agricultural Supply Chain Management with intelligence, trust, and innovation."
        />

        {/* Card grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          style={{
            marginTop: 60,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
          className="team-grid"
        >
          {TEAM.map((member, i) => (
            <TeamCard key={member.name} member={member} index={i} />
          ))}
        </motion.div>
      </div>

      {/* Keyframe for the rotating conic glow ring */}
      <style>{`
        @keyframes team-rotate {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 1024px) {
          .team-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .team-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Section>
  );
}
