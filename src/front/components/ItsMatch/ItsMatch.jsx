import './ItsMatch.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { resolvePhoto } from '../../assets/photoAssets.js';

// ── Mini confetti canvas ──────────────────────────────────────────────────────
const COLORS = ['#00f0ff', '#008cff', '#ff2d78', '#ffe600', '#a855f7', '#fff'];

function Confetti() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const particles = Array.from({ length: 90 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            w: 6 + Math.random() * 8,
            h: 4 + Math.random() * 5,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            speed: 1.5 + Math.random() * 2.5,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.15,
            drift: (Math.random() - 0.5) * 0.8,
        }));

        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.save();
                ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = 0.85;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
                p.y += p.speed;
                p.x += p.drift;
                p.angle += p.spin;
                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                }
            });
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, []);

    return <canvas ref={canvasRef} className="its-match-confetti" />;
}
// ─────────────────────────────────────────────────────────────────────────────

export const ItsMatch = ({ profile, myProfile, matchId, onClose }) => {
    const navigate = useNavigate();
    const [discordCopied, setDiscordCopied] = useState(false);

    if (!profile) return null;

    const handleGoToMatches = () => {
        onClose?.();
        navigate('/private/your-matches/');
    };

    const handleGoToChat = () => {
        onClose?.();
        navigate(`/private/chat/${matchId}`);
    };

    const copyDiscord = () => {
        if (profile.discord && profile.discord !== 'undefined') {
            navigator.clipboard.writeText(profile.discord).then(() => {
                setDiscordCopied(true);
                setTimeout(() => setDiscordCopied(false), 2000);
            });
        }
    };

    return (
        <div className="its-match-wrapper">
            <Confetti />

            {/* ── Header ── */}
            <div className="its-match-header">
                <span className="its-match-spark">✦</span>
                <h1 className="its-match-title">It's a Match!</h1>
                <span className="its-match-spark">✦</span>
            </div>
            <p className="its-match-subtitle">You and <strong>{profile.nick_name || 'this player'}</strong> liked each other</p>

            {/* ── Photos ── */}
            <div className="its-match-photos">
                <div className="its-match-photo-wrap its-match-photo-left">
                    <img
                        src={resolvePhoto(myProfile?.photo)}
                        alt="Your avatar"
                        className="its-match-avatar"
                    />
                    <span className="its-match-photo-label">You</span>
                </div>

                <div className="its-match-heart-center">
                    <i className="fa-solid fa-heart its-match-heart-icon" />
                </div>

                <div className="its-match-photo-wrap its-match-photo-right">
                    <img
                        src={resolvePhoto(profile.photo)}
                        alt={`${profile.nick_name}'s avatar`}
                        className="its-match-avatar"
                    />
                    <span className="its-match-photo-label">{profile.nick_name || 'Match'}</span>
                </div>
            </div>

            {/* ── Info ── */}
            <div className="its-match-info">
                {profile.location && profile.location !== 'undefined' && (
                    <span className="its-match-tag">
                        <i className="fa-solid fa-location-dot me-1" />
                        {profile.location}
                    </span>
                )}
                {profile.age && (
                    <span className="its-match-tag">
                        <i className="fa-solid fa-cake-candles me-1" />
                        {profile.age} years
                    </span>
                )}
                {profile.discord && profile.discord !== 'undefined' && (
                    <span
                        className={`its-match-tag its-match-discord${discordCopied ? ' its-match-discord--copied' : ''}`}
                        onClick={copyDiscord}
                        title="Click to copy Discord"
                    >
                        <i className={`fa-brands fa-discord me-1${discordCopied ? ' d-none' : ''}`} />
                        {discordCopied
                            ? <><i className="fa-solid fa-check me-1" />Copied!</>
                            : profile.discord
                        }
                    </span>
                )}
            </div>

            {/* ── Games preview ── */}
            {profile.games && profile.games.length > 0 && (
                <div className="its-match-games">
                    {profile.games.slice(0, 3).map((g, i) => (
                        <span key={i} className="its-match-game-chip">
                            <i className="fa-solid fa-gamepad me-1" />
                            {g.gameTitle}
                        </span>
                    ))}
                </div>
            )}

            {/* ── Actions ── */}
            <div className="its-match-actions">
                {matchId && (
                    <button
                        className="its-match-btn its-match-btn-primary"
                        onClick={handleGoToChat}
                    >
                        <i className="fa-solid fa-message me-2" />
                        Send message
                    </button>
                )}
                <button
                    className="its-match-btn its-match-btn-secondary"
                    onClick={handleGoToMatches}
                >
                    <i className="fa-solid fa-users me-2" />
                    View Matches
                </button>
                <button
                    className="its-match-btn its-match-btn-secondary"
                    onClick={onClose}
                >
                    Keep Searching
                    <i className="fa-solid fa-arrow-right ms-2" />
                </button>
            </div>
        </div>
    );
};
