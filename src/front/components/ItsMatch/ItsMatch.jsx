import './ItsMatch.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import photo1 from "../../assets/img/profile-pics/profile-pic-1.png";
import photo2 from "../../assets/img/profile-pics/profile-pic-2.png";
import photo3 from "../../assets/img/profile-pics/profile-pic-3.png";
import photo4 from "../../assets/img/profile-pics/profile-pic-4.png";
import photo5 from "../../assets/img/profile-pics/profile-pic-5.png";
import photo6 from "../../assets/img/profile-pics/profile-pic-6.png";
import photo7 from "../../assets/img/profile-pics/profile-pic-7.png";
import photo8 from "../../assets/img/profile-pics/profile-pic-8.png";
import photo9 from "../../assets/img/profile-pics/profile-pic-9.png";

const PHOTO_MAP = { photo1, photo2, photo3, photo4, photo5, photo6, photo7, photo8, photo9 };

const getPhoto = (key) => PHOTO_MAP[key?.trim()] || photo1;

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

export const ItsMatch = ({ profile, myProfile, onClose }) => {
    const navigate = useNavigate();

    if (!profile) return null;

    const handleGoToMatches = () => {
        onClose?.();
        navigate('/private/your-matches/');
    };

    const copyDiscord = () => {
        if (profile.discord && profile.discord !== 'undefined') {
            navigator.clipboard.writeText(profile.discord);
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
                        src={getPhoto(myProfile?.photo)}
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
                        src={getPhoto(profile.photo)}
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
                        className="its-match-tag its-match-discord"
                        onClick={copyDiscord}
                        title="Click to copy Discord"
                    >
                        <i className="fa-brands fa-discord me-1" />
                        {profile.discord}
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
                <button
                    className="its-match-btn its-match-btn-primary"
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
