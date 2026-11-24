import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || payload?.detail || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function formatStipend(amount) {
  if (amount === null || amount === undefined) return "Not specified";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(amount)) + " / month";
}

function formatDeadline(value) {
  if (!value) return "No deadline specified";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "See listing";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function Icon({ name, size = 18 }) {
  const paths = {
    compass: <><circle cx="12" cy="12" r="9"/><path d="m16.2 7.8-2.5 5.9-5.9 2.5 2.5-5.9 5.9-2.5Z"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    bookmark: <path d="M6 4h12v17l-6-4-6 4z"/>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></>,
    spark: <><path d="m12 3 1.6 6.4L20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3"/></>,
    logOut: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/></>,
    thumbs: <><path d="M7 10v12H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3ZM7 10l5-8c2.5 0 3 2 2 5l-1 3h6a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2H7"/></>,
    flag: <><path d="M4 22V4"/><path d="M4 4c7-5 9 5 16 0v12c-7 5-9-5-16 0"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    flag: <><path d="M4 22V4"/><path d="M4 4c7-5 9 5 16 0v12c-7 5-9-5-16 0"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.spark}</svg>;
}

function AuthPanel({ skills, mode, setMode, onSubmit, onGoogleCredential, googleClientId, busy, error }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [graduationYear, setGraduationYear] = useState("2027");
  const [skillIds, setSkillIds] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef(null);
  const googleCallbackRef = useRef(onGoogleCredential);
  googleCallbackRef.current = (credential) => onGoogleCredential(credential, mode === "register" ? {
    department: department.trim(),
    graduationYear: graduationYear ? Number(graduationYear) : null,
    skillIds,
  } : {});

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return undefined;
    let cancelled = false;
    let script = document.querySelector('script[data-google-identity="true"]');

    const renderButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response?.credential) googleCallbackRef.current(response.credential);
        },
        ux_mode: "popup",
        auto_select: false,
      });
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: mode === "login" ? "signin_with" : "signup_with",
        logo_alignment: "left",
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderButton);
    }

    return () => {
      cancelled = true;
      script?.removeEventListener("load", renderButton);
    };
  }, [googleClientId, mode]);

  function toggleSkill(id) {
    setSkillIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function submit(event) {
    event.preventDefault();
    onSubmit(mode, {
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      department: department.trim(),
      graduationYear: graduationYear ? Number(graduationYear) : null,
      skillIds,
    });
  }

  return (
    <div className="auth-layout">
      <section className="auth-story">
        <div className="eyebrow"><span className="eyebrow-dot"/> YOUR SKILLS. YOUR NEXT STEP.</div>
        <h1>Make your next move<br/><em>count.</em></h1>
        <p>Create your student profile, discover internships matched to your skills, and track every application from one place.</p>
        <div className="auth-benefits">
          <div><span className="auth-benefit-icon"><Icon name="spark" size={17}/></span><span><b>Skill-based recommendations</b><small>See why an internship matches your profile.</small></span></div>
          <div><span className="auth-benefit-icon"><Icon name="briefcase" size={17}/></span><span><b>Internship details in one place</b><small>Compare work mode, stipend, duration and skills.</small></span></div>
          <div><span className="auth-benefit-icon"><Icon name="bookmark" size={17}/></span><span><b>Application tracking</b><small>Keep your submitted applications together.</small></span></div>
        </div>
        <div className="auth-story-foot">INTERNMATCH · STUDENT OPPORTUNITY PLATFORM</div>
      </section>

      <section className="auth-card">
        <div className="auth-card-heading">
          <span className="brand-symbol"><Icon name="spark" size={19}/></span>
          <div><div className="section-kicker">STUDENT ACCOUNT</div><h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2><p>{mode === "login" ? "Sign in to open your personal opportunity space." : "Add your academic details and skills to get started."}</p></div>
        </div>
        <div className="auth-switch" role="tablist" aria-label="Account access">
          <button type="button" className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>Sign in</button>
          <button type="button" className={mode === "register" ? "selected" : ""} onClick={() => setMode("register")}>Create account</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && <>
            <label>Full name<input required maxLength="120" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name"/></label>
            <div className="auth-fields-two">
              <label>Department<input maxLength="120" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Science"/></label>
              <label>Graduation year<input type="number" min="2020" max="2100" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="2027"/></label>
            </div>
          </>}
          <label>Email address<input required type="email" autoComplete="email" maxLength="255" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/></label>
          <label>Password
            <span className="password-wrap"><input required type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength="8" maxLength="72" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters"/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}><Icon name="eye" size={16}/></button></span>
            {mode === "register" && <small className="field-hint">Use at least 8 characters. Your password is stored as a secure hash.</small>}
          </label>
          {mode === "register" && <div className="auth-skills">
            <div className="skill-heading"><span>Your skills</span><span>{skillIds.length} selected</span></div>
            <p>Select the skills you currently know. You can compare them with internship requirements after registration.</p>
            <div className="auth-skill-options">
              {skills.map((skill) => <button type="button" key={skill.skillId} className={skillIds.includes(skill.skillId) ? "auth-skill selected" : "auth-skill"} onClick={() => toggleSkill(skill.skillId)}>{skillIds.includes(skill.skillId) && <Icon name="check" size={12}/>} {skill.skillName}</button>)}
            </div>
          </div>}
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="button button-dark auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in to InternMatch" : "Create student account"} <Icon name="arrow" size={16}/></button>
        </form>
        {googleClientId && <>
          <div className="google-auth-divider"><span>OR</span></div>
          <div className="google-auth-slot" ref={googleButtonRef} aria-label="Continue with Google"/>
          <p className="google-auth-note">Use your Google account to sign in securely.</p>
        </>}
        <div className="auth-secure"><Icon name="lock" size={14}/> Your student account is protected by a private session.</div>
      </section>
    </div>
  );
}


function ProfileEditor({ student, skills, onCancel, onSave, busy, error }) {
  const [fullName, setFullName] = useState(student.fullName || "");
  const [department, setDepartment] = useState(student.department || "");
  const [graduationYear, setGraduationYear] = useState(student.graduationYear || "");
  const [selectedSkills, setSelectedSkills] = useState(
    skills.filter((skill) => (student.skills || []).includes(skill.skillName)).map((skill) => skill.skillId)
  );

  function toggleSkill(id) {
    setSelectedSkills((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id]);
  }

  function submit(event) {
    event.preventDefault();
    onSave({
      fullName: fullName.trim(),
      department: department.trim(),
      graduationYear: graduationYear ? Number(graduationYear) : null,
      skillIds: selectedSkills,
    });
  }

  return (
    <form className="profile-card profile-edit-card" onSubmit={submit}>
      <div className="profile-banner"/>
      <div className="profile-content">
        <span className="profile-label">EDIT YOUR STUDENT PROFILE</span>
        <h3>Keep your details current</h3>
        <p>Your selected skills are used to calculate internship matches.</p>
        <label className="profile-edit-field">Full name<input required maxLength="120" value={fullName} onChange={(event) => setFullName(event.target.value)}/></label>
        <label className="profile-edit-field">Department<input maxLength="120" value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="e.g. Computer Science"/></label>
        <label className="profile-edit-field">Graduation year<input type="number" min="2020" max="2100" value={graduationYear} onChange={(event) => setGraduationYear(event.target.value)} placeholder="2027"/></label>
        <span className="profile-label profile-label-spaced">YOUR SKILLS</span>
        <div className="profile-edit-skills">
          {skills.map((skill) => <label key={skill.skillId} className="profile-edit-skill"><input type="checkbox" checked={selectedSkills.includes(skill.skillId)} onChange={() => toggleSkill(skill.skillId)}/>{skill.skillName}</label>)}
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <div className="profile-edit-actions"><button type="button" className="button button-outline" onClick={onCancel}>Cancel</button><button type="submit" className="button button-dark" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></div>
      </div>
    </form>
  );
}

function InternshipCard({ internship, onApply, onDetails, onToggleSave, isSaved, applied, applying }) {
  const score = Number(internship.matchScore ?? 0);
  const matched = internship.matchedSkills || [];
  const required = internship.requiredSkills || [];
  return (
    <article className="internship-card">
      <div className="card-topline">
        <div className="company-mark">{initials(internship.companyName)}</div>
        <div className="match-pill"><Icon name="spark" size={13}/>{score}% match</div>
      </div>
      <div className="company-name">{internship.companyName}</div>
      <h3>{internship.title}</h3>
      <p className="card-description">{internship.description}</p>
      <div className="meta-row">
        <span><Icon name="pin" size={14}/>{internship.location || "Location flexible"}</span>
        <span><Icon name="briefcase" size={14}/>{(internship.workMode || "Flexible").toLowerCase()}</span>
        <span><Icon name="clock" size={14}/>{internship.durationWeeks ? `${internship.durationWeeks} weeks` : "Flexible"}</span>
      </div>
      <div className="skill-area">
        <div className="skill-heading"><span>Required skills</span><span>{matched.length}/{required.length} matched</span></div>
        <div className="skill-list">
          {required.map((skill) => (
            <span className={matched.some((m) => m.toLowerCase() === skill.toLowerCase()) ? "skill-chip matched" : "skill-chip"} key={skill}>
              {matched.some((m) => m.toLowerCase() === skill.toLowerCase()) && <Icon name="check" size={11}/>}
              {skill}
            </span>
          ))}
        </div>
      </div>
      <div className="card-bottom">
        <div><strong>{formatStipend(internship.stipendAmount)}</strong><small>{formatDeadline(internship.applicationDeadline)}</small></div>
        <div className="card-actions">
          <button className={isSaved ? "button button-saved" : "button button-outline"} onClick={() => onToggleSave(internship)}>{isSaved ? "Saved" : "Save"}</button>
          <button className="button button-outline" onClick={() => onDetails(internship)}>Details</button>
          <button className={applied ? "button button-applied" : "button button-dark"} onClick={() => onApply(internship)} disabled={applied || applying}>
            {applied ? "Applied" : applying ? "Applying…" : "Apply"} {!applied && <Icon name="arrow" size={15}/>}
          </button>
        </div>
      </div>
    </article>
  );
}

function InternshipDetails({ internship, onClose, onApply, onToggleSave, isSaved, applied, applying }) {
  if (!internship) return null;
  const required = internship.requiredSkills || [];
  const matched = internship.matchedSkills || [];
  const missing = internship.missingSkills || [];
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="internship-modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Close details"><Icon name="close"/></button>
        <div className="details-company"><span className="company-mark">{initials(internship.companyName)}</span><div><div className="company-name">{internship.companyName}</div><span className="details-open">{internship.status || "OPEN"} opportunity</span></div><div className="match-pill"><Icon name="spark" size={13}/>{Number(internship.matchScore || 0)}% match</div></div>
        <h2 id="internship-modal-title">{internship.title}</h2>
        <p className="details-description">{internship.description || "The company has not provided a longer role description."}</p>
        <div className="details-facts">
          <div><small>LOCATION</small><b>{internship.location || "Not specified"}</b></div>
          <div><small>WORK MODE</small><b>{(internship.workMode || "Not specified").replaceAll("_", " ")}</b></div>
          <div><small>DURATION</small><b>{internship.durationWeeks ? `${internship.durationWeeks} weeks` : "Not specified"}</b></div>
          <div><small>STIPEND</small><b>{formatStipend(internship.stipendAmount)}</b></div>
          <div><small>APPLICATION DEADLINE</small><b>{formatDeadline(internship.applicationDeadline)}</b></div>
          <div><small>SKILL MATCH</small><b>{matched.length} of {required.length} required skills</b></div>
        </div>
        <div className="details-skills">
          <h3>Required skills</h3>
          <div className="skill-list">{required.length ? required.map((skill) => <span className={matched.some((item) => item.toLowerCase() === skill.toLowerCase()) ? "skill-chip matched" : "skill-chip"} key={skill}>{matched.some((item) => item.toLowerCase() === skill.toLowerCase()) && <Icon name="check" size={11}/>} {skill}</span>) : <span className="details-muted">No required skills listed.</span>}</div>
          <div className="skills-explainer"><span><i className="legend-dot matched-dot"/> You have: {matched.length ? matched.join(", ") : "No matching skills yet"}</span><span><i className="legend-dot missing-dot"/> To develop: {missing.length ? missing.join(", ") : "None"}</span></div>
        </div>
        <div className="details-footer"><span>Match score is calculated from required skill overlap.</span><div className="details-footer-actions"><button className={isSaved ? "button button-saved" : "button button-outline"} onClick={() => onToggleSave(internship)}>{isSaved ? "Saved" : "Save for later"}</button><button className="button button-dark" disabled={applied || applying} onClick={() => onApply(internship)}>{applied ? "Already applied" : applying ? "Applying…" : "Apply for this internship"} <Icon name="arrow" size={15}/></button></div></div>
      </section>
    </div>
  );
}


const COMMUNITY_CATEGORIES = [
  { value: "ALL", label: "All discussions" },
  { value: "INTERNSHIP_QUESTIONS", label: "Internship Q&A" },
  { value: "EXPERIENCES", label: "Experiences" },
  { value: "INTERVIEW_PREP", label: "Interview prep" },
  { value: "CAREER_ADVICE", label: "Career advice" },
  { value: "STUDENT_LIFE", label: "Student life" },
  { value: "GENERAL", label: "General" },
];

function communityCategoryLabel(value) {
  return COMMUNITY_CATEGORIES.find((item) => item.value === value)?.label || "Discussion";
}

function communityTimeAgo(value) {
  if (!value) return "Recently";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function CommunityPage({ student }) {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("NEWEST");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postCategory, setPostCategory] = useState("INTERNSHIP_QUESTIONS");
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [expandedPosts, setExpandedPosts] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentBusy, setCommentBusy] = useState(null);
  const [reportingPostId, setReportingPostId] = useState(null);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  async function loadPosts() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ sort, category });
      if (search.trim()) params.set("q", search.trim());
      const data = await api(`/api/community/posts?${params.toString()}`);
      setPosts(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [sort, category, search]);

  function openComposer() {
    setEditingPostId(null);
    setPostCategory("INTERNSHIP_QUESTIONS");
    setPostTitle("");
    setPostBody("");
    setError("");
    setShowComposer(true);
  }

  function startEditing(post) {
    setEditingPostId(post.postId);
    setPostCategory(post.category);
    setPostTitle(post.title);
    setPostBody(post.body);
    setError("");
    setShowComposer(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitPost(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const endpoint = editingPostId
        ? `/api/community/posts/${editingPostId}`
        : "/api/community/posts";
      const saved = await api(endpoint, {
        method: editingPostId ? "PUT" : "POST",
        body: JSON.stringify({ category: postCategory, title: postTitle.trim(), body: postBody.trim() }),
      });
      setShowComposer(false);
      setEditingPostId(null);
      setPostTitle("");
      setPostBody("");
      setNotice(editingPostId ? "Your discussion has been updated." : "Your discussion has been posted.");
      if (sort === "NEWEST") {
        setPosts((current) => [saved, ...current.filter((item) => item.postId !== saved.postId)]);
      } else {
        await loadPosts();
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function deletePost(post) {
    if (!window.confirm("Delete this discussion? Its comments and votes will also be removed.")) return;
    try {
      await api(`/api/community/posts/${post.postId}`, { method: "DELETE" });
      setPosts((current) => current.filter((item) => item.postId !== post.postId));
      setNotice("Your discussion has been deleted.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function toggleUpvote(post) {
    try {
      const updated = await api(`/api/community/posts/${post.postId}/upvote`, {
        method: post.upvotedByMe ? "DELETE" : "POST",
      });
      setPosts((current) => current.map((item) => item.postId === updated.postId ? updated : item));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function toggleComments(post) {
    const opening = !expandedPosts[post.postId];
    setExpandedPosts((current) => ({ ...current, [post.postId]: opening }));
    if (opening && !commentsByPost[post.postId]) {
      try {
        const data = await api(`/api/community/posts/${post.postId}/comments`);
        setCommentsByPost((current) => ({ ...current, [post.postId]: data }));
      } catch (requestError) {
        setError(requestError.message);
      }
    }
  }

  async function submitComment(post, event) {
    event.preventDefault();
    const body = (commentDrafts[post.postId] || "").trim();
    if (!body) return;
    setCommentBusy(post.postId);
    try {
      const comment = await api(`/api/community/posts/${post.postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setCommentsByPost((current) => ({
        ...current,
        [post.postId]: [...(current[post.postId] || []), comment],
      }));
      setCommentDrafts((current) => ({ ...current, [post.postId]: "" }));
      setPosts((current) => current.map((item) => item.postId === post.postId
        ? { ...item, commentCount: item.commentCount + 1 }
        : item));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCommentBusy(null);
    }
  }

  async function deleteComment(postId, commentId) {
    try {
      await api(`/api/community/comments/${commentId}`, { method: "DELETE" });
      setCommentsByPost((current) => ({
        ...current,
        [postId]: (current[postId] || []).filter((item) => item.commentId !== commentId),
      }));
      setPosts((current) => current.map((item) => item.postId === postId
        ? { ...item, commentCount: Math.max(0, item.commentCount - 1) }
        : item));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function submitReport(post, event) {
    event.preventDefault();
    setReportBusy(true);
    try {
      await api(`/api/community/posts/${post.postId}/report`, {
        method: "POST",
        body: JSON.stringify({ reason: reportReason, details: reportDetails.trim() }),
      });
      setReportingPostId(null);
      setReportDetails("");
      setNotice("Thanks. Your report has been recorded for review.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setReportBusy(false);
    }
  }

  const totalComments = posts.reduce((sum, post) => sum + Number(post.commentCount || 0), 0);
  const postCountByCategory = posts.reduce((counts, post) => {
    counts[post.category] = (counts[post.category] || 0) + 1;
    return counts;
  }, {});

  return (
    <section className="community-page">
      <div className="community-banner">
        <div>
          <div className="section-kicker">STUDENTS HELPING STUDENTS</div>
          <h2>Share what you know.<br/><em>Ask what you don’t.</em></h2>
          <p>Ask internship questions, share interview experiences, celebrate small wins, and get advice from people on the same journey.</p>
        </div>
        <div className="community-banner-stats">
          <div><strong>{posts.length}</strong><span>discussions here</span></div>
          <div><strong>{totalComments}</strong><span>replies in this view</span></div>
        </div>
      </div>

      {notice && <div className="community-feedback">{notice}<button type="button" onClick={() => setNotice("")}>Dismiss</button></div>}
      {error && <div className="community-error" role="alert">{error}<button type="button" onClick={() => setError("")}>Dismiss</button></div>}

      <div className="community-layout">
        <main className="community-main">
          <button className="community-composer-trigger" type="button" onClick={openComposer}>
            <span className="community-trigger-avatar">{initials(student.fullName)}</span>
            <span>Have a question or experience to share? Start a discussion…</span>
            <span className="community-trigger-plus"><Icon name="plus" size={17}/> Post</span>
          </button>

          {showComposer && (
            <form className="community-composer" onSubmit={submitPost}>
              <div className="community-composer-heading">
                <div><span className="section-kicker">{editingPostId ? "EDIT DISCUSSION" : "NEW DISCUSSION"}</span><h3>{editingPostId ? "Update your post" : "Start a conversation"}</h3></div>
                <button className="community-icon-button" type="button" onClick={() => setShowComposer(false)} aria-label="Close composer"><Icon name="close" size={18}/></button>
              </div>
              <label>Choose a topic
                <select value={postCategory} onChange={(event) => setPostCategory(event.target.value)}>
                  {COMMUNITY_CATEGORIES.filter((item) => item.value !== "ALL").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label>Discussion title
                <input required maxLength="180" value={postTitle} onChange={(event) => setPostTitle(event.target.value)} placeholder="What would you like to talk about?"/>
              </label>
              <label>Your thoughts
                <textarea required maxLength="10000" rows="5" value={postBody} onChange={(event) => setPostBody(event.target.value)} placeholder="Share the context, ask your question, or tell the community what you learned…"/>
              </label>
              <div className="community-composer-bottom"><span>{postBody.length}/10,000 characters · Be kind and constructive.</span><button className="button button-dark" disabled={busy}>{busy ? "Posting…" : editingPostId ? "Save changes" : "Publish discussion"} <Icon name="send" size={15}/></button></div>
            </form>
          )}

          <div className="community-feed-toolbar">
            <div><span className="section-kicker">COMMUNITY FEED</span><h3>Conversations from students</h3></div>
            <div className="community-sort">
              <button className={sort === "NEWEST" ? "selected" : ""} onClick={() => setSort("NEWEST")}>Newest</button>
              <button className={sort === "TOP" ? "selected" : ""} onClick={() => setSort("TOP")}>Top</button>
            </div>
          </div>

          <label className="community-search"><Icon name="search" size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search discussions, questions or advice…"/></label>
          <div className="community-category-list">
            {COMMUNITY_CATEGORIES.map((item) => <button type="button" key={item.value} className={category === item.value ? "community-category active" : "community-category"} onClick={() => setCategory(item.value)}>{item.label}</button>)}
          </div>

          {loading ? <div className="community-empty"><div className="loader"/><p>Loading conversations…</p></div> : posts.length ? (
            <div className="community-post-list">
              {posts.map((post) => (
                <article className="community-post" key={post.postId}>
                  <div className="community-post-top">
                    <div className="community-author-avatar">{initials(post.authorName)}</div>
                    <div className="community-author-meta"><strong>{post.authorName}</strong><span>{post.authorDepartment || "Student"} · {communityTimeAgo(post.createdAt)}</span></div>
                    <span className="community-post-category">{communityCategoryLabel(post.category)}</span>
                  </div>
                  <h3 className="community-post-title">{post.title}</h3>
                  <p className="community-post-body">{post.body}</p>
                  <div className="community-post-actions">
                    <button type="button" className={post.upvotedByMe ? "community-action upvoted" : "community-action"} onClick={() => toggleUpvote(post)}><Icon name="thumbs" size={16}/>{post.upvotedByMe ? "Upvoted" : "Upvote"} <span>{post.upvoteCount}</span></button>
                    <button type="button" className="community-action" onClick={() => toggleComments(post)}><Icon name="message" size={16}/>{expandedPosts[post.postId] ? "Hide comments" : "Comments"} <span>{post.commentCount}</span></button>
                    {post.authorStudentId === student.studentId ? <>
                      <button type="button" className="community-action" onClick={() => startEditing(post)}><Icon name="edit" size={15}/> Edit</button>
                      <button type="button" className="community-action subtle-danger" onClick={() => deletePost(post)}><Icon name="trash" size={15}/> Delete</button>
                    </> : <button type="button" className="community-action report-action" onClick={() => { setReportingPostId(reportingPostId === post.postId ? null : post.postId); setReportReason("SPAM"); setReportDetails(""); }}><Icon name="flag" size={15}/> Report</button>}
                  </div>

                  {reportingPostId === post.postId && (
                    <form className="community-report-form" onSubmit={(event) => submitReport(post, event)}>
                      <div className="community-report-heading">Report this discussion</div>
                      <div className="community-report-fields">
                        <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
                          <option value="SPAM">Spam or promotion</option><option value="HARASSMENT">Harassment</option><option value="MISINFORMATION">Misleading information</option><option value="INAPPROPRIATE">Inappropriate content</option><option value="OTHER">Other</option>
                        </select>
                        <input maxLength="500" value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} placeholder="Optional details"/>
                        <button className="button button-outline" disabled={reportBusy}>{reportBusy ? "Sending…" : "Submit report"}</button>
                      </div>
                    </form>
                  )}

                  {expandedPosts[post.postId] && (
                    <div className="community-comments">
                      <div className="community-comments-heading">{post.commentCount} {post.commentCount === 1 ? "reply" : "replies"}</div>
                      {(commentsByPost[post.postId] || []).map((comment) => (
                        <div className="community-comment" key={comment.commentId}>
                          <div className="community-comment-avatar">{initials(comment.authorName)}</div>
                          <div className="community-comment-content"><div><strong>{comment.authorName}</strong><span>{communityTimeAgo(comment.createdAt)}</span></div><p>{comment.body}</p></div>
                          {comment.authorStudentId === student.studentId && <button className="community-icon-button" type="button" title="Delete comment" onClick={() => deleteComment(post.postId, comment.commentId)}><Icon name="trash" size={14}/></button>}
                        </div>
                      ))}
                      {!(commentsByPost[post.postId] || []).length && <p className="community-no-comments">No replies yet. Be the first to help.</p>}
                      <form className="community-reply-form" onSubmit={(event) => submitComment(post, event)}>
                        <span className="community-comment-avatar">{initials(student.fullName)}</span>
                        <input value={commentDrafts[post.postId] || ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.postId]: event.target.value }))} maxLength="4000" placeholder="Write a thoughtful reply…" aria-label="Write a comment"/>
                        <button type="submit" className="community-reply-send" disabled={commentBusy === post.postId || !(commentDrafts[post.postId] || "").trim()} aria-label="Send reply"><Icon name="send" size={16}/></button>
                      </form>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="community-empty"><span className="empty-icon"><Icon name="message" size={25}/></span><h3>No discussions yet</h3><p>Be the first student to start a conversation in this category.</p><button className="button button-dark" onClick={openComposer}>Start the first discussion <Icon name="plus" size={15}/></button></div>
          )}
        </main>

        <aside className="community-sidebar">
          <div className="community-side-card community-welcome-card">
            <div className="section-kicker">A SPACE FOR STUDENTS</div><h3>Everyone starts somewhere.</h3>
            <p>Share honest experiences, ask questions without worrying about having all the answers, and help the next student learn from your journey.</p>
            <button className="button button-dark" onClick={openComposer}><Icon name="plus" size={15}/> Start a discussion</button>
          </div>
          <div className="community-side-card">
            <div className="section-kicker">COMMUNITY GUIDELINES</div><h3>Keep this space useful</h3>
            <ul>
              <li>Be respectful. Students have different backgrounds and experience levels.</li>
              <li>Share genuine experiences; make it clear when something is only your opinion.</li>
              <li>Never post passwords, phone numbers, private documents or confidential interview material.</li>
              <li>Do not pay anyone for referrals or share suspicious internship links.</li>
            </ul>
          </div>
          <div className="community-side-card">
            <div className="section-kicker">EXPLORE TOPICS</div><h3>Find your conversation</h3>
            <div className="community-topic-links">
              {COMMUNITY_CATEGORIES.filter((item) => item.value !== "ALL").map((item) => <button key={item.value} onClick={() => { setCategory(item.value); window.scrollTo({ top: 0, behavior: "smooth" }); }}><span>{item.label}</span><Icon name="arrow" size={14}/></button>)}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default function App() {
  const [currentStudent, setCurrentStudent] = useState(null);
  const [googleClientId, setGoogleClientId] = useState("");
  const [internships, setInternships] = useState([]);
  const [skills, setSkills] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [savedInternshipIds, setSavedInternshipIds] = useState([]);
  const [tab, setTab] = useState("discover");
  const [sortBy, setSortBy] = useState("match");
  const [stipendFilter, setStipendFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState("all");
  const [minimumMatch, setMinimumMatch] = useState("0");
  const [applyingId, setApplyingId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [notice, setNotice] = useState("");
  const [selectedInternship, setSelectedInternship] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setAuthLoading(true);
      try {
        const [internshipData, skillData, sessionStudent, authConfig] = await Promise.all([
          api("/api/internships"),
          api("/api/skills"),
          api("/api/auth/me").catch(() => null),
          api("/api/auth/config").catch(() => ({ googleClientId: "" })),
        ]);
        if (!active) return;
        setInternships(internshipData);
        setSkills(skillData);
        setCurrentStudent(sessionStudent);
        setGoogleClientId(authConfig?.googleClientId || "");
        setApiOnline(true);
      } catch (error) {
        if (!active) return;
        setApiOnline(false);
        setNotice(`The application server could not be reached: ${error.message}`);
      } finally {
        if (active) {
          setLoading(false);
          setAuthLoading(false);
        }
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadRecommendations() {
      if (!currentStudent || !apiOnline) {
        setRecommendations([]);
        return;
      }
      try {
        const data = await api(`/api/students/${currentStudent.studentId}/recommendations`);
        if (active) setRecommendations(data);
      } catch (error) {
        if (active) setNotice(error.message);
      }
    }
    loadRecommendations();
    return () => { active = false; };
  }, [apiOnline, currentStudent]);

  useEffect(() => {
    let active = true;
    async function loadApplications() {
      if (tab !== "applications" || !currentStudent || !apiOnline) return;
      try {
        const data = await api(`/api/students/${currentStudent.studentId}/applications`);
        if (active) setApplications(data);
      } catch (error) {
        if (active) setNotice(error.message);
      }
    }
    loadApplications();
    return () => { active = false; };
  }, [tab, apiOnline, currentStudent]);

  useEffect(() => {
    let active = true;
    async function loadSavedInternships() {
      if (!currentStudent || !apiOnline) {
        setSavedInternshipIds([]);
        return;
      }
      try {
        const ids = await api(`/api/students/${currentStudent.studentId}/saved-internships`);
        if (active) setSavedInternshipIds(ids);
      } catch (error) {
        if (active) setNotice(error.message);
      }
    }
    loadSavedInternships();
    return () => { active = false; };
  }, [apiOnline, currentStudent]);

  async function handleAuth(mode, formData) {
    setAuthBusy(true);
    setAuthError("");
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const student = await api(endpoint, { method: "POST", body: JSON.stringify(formData) });
      setCurrentStudent(student);
      setApplications([]);
      setTab("discover");
      setNotice(mode === "register" ? "Your student account has been created." : `Welcome back, ${student.fullName.split(" ")[0]}.`);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleGoogleCredential(credential, profileDetails = {}) {
    setAuthBusy(true);
    setAuthError("");
    try {
      const student = await api("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential, ...profileDetails }),
      });
      setCurrentStudent(student);
      setApplications([]);
      setTab("discover");
      setNotice(`Signed in with Google. Welcome, ${student.fullName.split(" ")[0]}.`);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleToggleSave(internship) {
    if (!currentStudent || !apiOnline) return;
    const internshipId = internship.internshipId;
    const alreadySaved = savedInternshipIds.includes(internshipId);
    try {
      await api(`/api/students/${currentStudent.studentId}/saved-internships/${internshipId}`, {
        method: alreadySaved ? "DELETE" : "POST",
      });
      setSavedInternshipIds((current) => alreadySaved
        ? current.filter((id) => id !== internshipId)
        : [...current, internshipId]);
      setNotice(alreadySaved ? "Internship removed from your saved list." : "Internship saved for later.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleUpdateProfile(profile) {
    setProfileBusy(true);
    setProfileError("");
    try {
      const student = await api(`/api/students/${currentStudent.studentId}`, {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      setCurrentStudent(student);
      setEditingProfile(false);
      setNotice("Your student profile has been updated. Recommendations are being refreshed.");
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setProfileBusy(false);
    }
  }

  async function handleLogout() {
    try { await api("/api/auth/logout", { method: "POST" }); } catch { /* Clear local state even if the session expired. */ }
    setCurrentStudent(null);
    setRecommendations([]);
    setApplications([]);
    setSavedInternshipIds([]);
    setEditingProfile(false);
    setTab("discover");
    setNotice("You have signed out.");
  }

  const visibleInternships = useMemo(() => {
    const source = currentStudent ? recommendations : internships;
    const filtered = source.filter((internship) => {
      const text = `${internship.title} ${internship.companyName} ${internship.location} ${(internship.requiredSkills || []).join(" ")}`.toLowerCase();
      const modeMatches = workMode === "all" || (internship.workMode || "").toLowerCase() === workMode;
      const stipend = Number(internship.stipendAmount || 0);
      const stipendMatches = stipendFilter === "all"
        || (stipendFilter === "paid" && stipend > 0)
        || (stipendFilter === "unpaid" && stipend <= 0);
      const weeks = Number(internship.durationWeeks || 0);
      const durationMatches = durationFilter === "all"
        || (durationFilter === "short" && weeks > 0 && weeks <= 8)
        || (durationFilter === "medium" && weeks >= 9 && weeks <= 12)
        || (durationFilter === "long" && weeks > 12);
      return text.includes(search.toLowerCase()) && modeMatches && stipendMatches && durationMatches
        && (!currentStudent || Number(internship.matchScore || 0) >= Number(minimumMatch));
    });

    return filtered.sort((left, right) => {
      if (sortBy === "stipend") return Number(right.stipendAmount || 0) - Number(left.stipendAmount || 0);
      if (sortBy === "deadline") {
        const leftDate = left.applicationDeadline ? new Date(`${left.applicationDeadline}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        const rightDate = right.applicationDeadline ? new Date(`${right.applicationDeadline}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        return leftDate - rightDate;
      }
      if (sortBy === "duration") return Number(left.durationWeeks || Number.MAX_SAFE_INTEGER) - Number(right.durationWeeks || Number.MAX_SAFE_INTEGER);
      return Number(right.matchScore || 0) - Number(left.matchScore || 0);
    });
  }, [currentStudent, recommendations, internships, search, workMode, minimumMatch, stipendFilter, durationFilter, sortBy]);

  const savedInternships = savedInternshipIds
    .map((id) => recommendations.find((item) => item.internshipId === id)
      || internships.find((item) => item.internshipId === id))
    .filter(Boolean);

  const skillGapSummary = useMemo(() => {
    const totals = new Map();
    recommendations.forEach((internship) => {
      (internship.missingSkills || []).forEach((skill) => {
        const key = skill.toLowerCase();
        const entry = totals.get(key) || { skill, count: 0, roles: [] };
        entry.count += 1;
        if (entry.roles.length < 3) entry.roles.push(internship.title);
        totals.set(key, entry);
      });
    });
    return [...totals.values()].sort((left, right) => right.count - left.count || left.skill.localeCompare(right.skill)).slice(0, 8);
  }, [recommendations]);

  const filteredApplications = applications.filter((application) =>
    applicationFilter === "all" || application.status === applicationFilter
  );

  async function handleApply(internship) {
    if (!apiOnline || !currentStudent) return;
    setApplyingId(internship.internshipId);
    setNotice("");
    try {
      await api("/api/applications", {
        method: "POST",
        body: JSON.stringify({ studentId: currentStudent.studentId, internshipId: internship.internshipId }),
      });
      setNotice(`Your application for ${internship.title} has been recorded.`);
      const data = await api(`/api/students/${currentStudent.studentId}/applications`);
      setApplications(data);
      setSelectedInternship(null);
      setTab("applications");
    } catch (error) {
      setNotice(error.status === 409
        ? "You have already applied to this internship."
        : error.message);
    } finally {
      setApplyingId(null);
    }
  }

  const appliedIds = new Set(applications.map((application) => application.internshipId));
  const perfectMatches = recommendations.filter((item) => Number(item.matchScore) === 100).length;
  const averageMatch = recommendations.length
    ? Math.round(recommendations.reduce((sum, item) => sum + Number(item.matchScore || 0), 0) / recommendations.length)
    : 0;

  if (authLoading || loading) {
    return <div className="auth-loading"><span className="brand-symbol"><Icon name="spark" size={20}/></span><div className="loader"/><p>Preparing your opportunity space…</p></div>;
  }

  if (!apiOnline) {
    return <div className="auth-loading"><span className="brand-symbol"><Icon name="spark" size={20}/></span><h2>InternMatch is temporarily unavailable</h2><p>{notice || "Please refresh the page in a moment."}</p><button className="button button-dark" onClick={() => window.location.reload()}>Try again</button></div>;
  }

  if (!currentStudent) {
    return (
      <div className="app-shell auth-shell">
        <header className="site-header auth-header"><a className="brand" href="#top"><span className="brand-symbol"><Icon name="spark" size={19}/></span><span>intern<span>match</span></span></a><span className="mode-indicator"><span className="status-light live"/>Secure student access</span></header>
        <AuthPanel skills={skills} mode={authMode} setMode={(mode) => { setAuthMode(mode); setAuthError(""); }} onSubmit={handleAuth} onGoogleCredential={handleGoogleCredential} googleClientId={googleClientId} busy={authBusy} error={authError}/>
        <footer className="site-footer"><a className="brand footer-brand" href="#top"><span className="brand-symbol"><Icon name="spark" size={17}/></span><span>intern<span>match</span></span></a><span>Helping skills find the right opportunity.</span><span>Internship Matching System · Student project</span></footer>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="InternMatch home">
          <span className="brand-symbol"><Icon name="spark" size={19}/></span>
          <span>intern<span>match</span></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={tab === "discover" ? "nav-link active" : "nav-link"} onClick={() => setTab("discover")}><Icon name="compass" size={16}/> Discover</button>
          <button className={tab === "profile" ? "nav-link active" : "nav-link"} onClick={() => setTab("profile")}><Icon name="user" size={16}/> My profile</button>
          <button className={tab === "applications" ? "nav-link active" : "nav-link"} onClick={() => setTab("applications")}><Icon name="briefcase" size={16}/> Applications</button>
          <button className={tab === "saved" ? "nav-link active" : "nav-link"} onClick={() => setTab("saved")}><Icon name="bookmark" size={16}/> Saved <span className="nav-count">{savedInternshipIds.length}</span></button>
          <button className={tab === "insights" ? "nav-link active" : "nav-link"} onClick={() => setTab("insights")}><Icon name="spark" size={16}/> Career insights</button>
          <button className={tab === "community" ? "nav-link active" : "nav-link"} onClick={() => setTab("community")}><Icon name="message" size={16}/> Community</button>
        </nav>
        <div className="header-user account-header">
          <div className="avatar">{initials(currentStudent.fullName)}</div>
          <span className="header-account-name">{currentStudent.fullName}</span>
          <button className="signout-button" onClick={handleLogout}><Icon name="logOut" size={15}/> Sign out</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot"/> YOUR SKILLS. YOUR NEXT STEP.</div>
            <h1>Find work that<br/><em>fits who you are.</em></h1>
            <p>Explore internships that line up with your skills, see where you match, and focus on opportunities worth your time.</p>
            <button className="button button-light" onClick={() => { setTab("discover"); document.getElementById("opportunities")?.scrollIntoView({ behavior: "smooth" }); }}>
              Explore opportunities <Icon name="arrow" size={16}/>
            </button>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
            <div className="orbit-core"><Icon name="spark" size={38}/></div>
            <div className="float-card float-card-one"><span className="float-icon green"><Icon name="check" size={14}/></span><span><b>Skills aligned</b><small>See your strengths</small></span></div>
            <div className="float-card float-card-two"><span className="float-score">92%</span><span><b>Strong match</b><small>Built around your skills</small></span></div>
            <div className="art-dot dot-one"/><div className="art-dot dot-two"/><div className="art-dot dot-three"/>
          </div>
          <div className="hero-bottom"><span>MADE FOR STUDENTS BUILDING WHAT'S NEXT</span><span>DISCOVER · MATCH · APPLY</span></div>
        </section>

        {notice && <div className="notice notice-info">{notice}</div>}

        <section className="welcome-row">
          <div>
            <div className="section-kicker">YOUR OPPORTUNITY SPACE</div>
            <h2>{tab === "discover" ? `A good next step, ${currentStudent.fullName.split(" ")[0]}.` : tab === "profile" ? "Your student profile" : tab === "applications" ? "Your applications" : tab === "saved" ? "Your saved internships" : tab === "community" ? "Student community" : "Your career insights"}</h2>
            <p>{tab === "discover" ? "A shortlist shaped around the skills you already have." : tab === "profile" ? "Your academic details and skills shape your recommendations." : tab === "applications" ? "Keep track of the opportunities you've applied to." : tab === "saved" ? "Opportunities you bookmarked to revisit later." : tab === "community" ? "Ask questions, share experiences and help other students navigate internships." : "See which skills could unlock more internship opportunities."}</p>
          </div>
          <div className="mode-indicator"><span className="status-light live"/>Signed in · Live account</div>
        </section>

        {tab === "community" && <CommunityPage student={currentStudent}/>}

        {tab === "discover" && <>
          <section className="stats-grid">
            <div className="stat-card"><span className="stat-icon violet"><Icon name="briefcase"/></span><span className="stat-value">{internships.length}</span><span className="stat-label">Open opportunities</span></div>
            <div className="stat-card"><span className="stat-icon peach"><Icon name="spark"/></span><span className="stat-value">{perfectMatches}</span><span className="stat-label">Perfect skill matches</span></div>
            <div className="stat-card"><span className="stat-icon mint"><Icon name="code"/></span><span className="stat-value">{currentStudent.skills?.length || 0}</span><span className="stat-label">Skills in your profile</span></div>
            <div className="stat-card"><span className="stat-icon blue"><Icon name="compass"/></span><span className="stat-value">{averageMatch}%</span><span className="stat-label">Average match score</span></div>
          </section>

          <section id="opportunities" className="opportunities-section">
            <div className="section-heading">
              <div><div className="section-kicker">CURATED FOR YOUR SKILLS</div><h2>Opportunities to explore</h2></div>
              <span className="result-count">{visibleInternships.length} results</span>
            </div>
            <div className="filter-bar">
              <label className="search-box"><Icon name="search" size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search role, company or skill…"/></label>
              <select value={workMode} onChange={(event) => setWorkMode(event.target.value)} aria-label="Filter by work mode">
                <option value="all">All work modes</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option>
              </select>
              <select value={minimumMatch} onChange={(event) => setMinimumMatch(event.target.value)} aria-label="Filter by minimum match">
                <option value="0">Any match</option><option value="50">50%+ match</option><option value="75">75%+ match</option><option value="100">100% match</option>
              </select>
              <select value={stipendFilter} onChange={(event) => setStipendFilter(event.target.value)} aria-label="Filter by stipend">
                <option value="all">Any stipend</option><option value="paid">Paid only</option><option value="unpaid">Unpaid / not listed</option>
              </select>
              <select value={durationFilter} onChange={(event) => setDurationFilter(event.target.value)} aria-label="Filter by duration">
                <option value="all">Any duration</option><option value="short">Up to 8 weeks</option><option value="medium">9–12 weeks</option><option value="long">Over 12 weeks</option>
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort internships">
                <option value="match">Best match first</option><option value="stipend">Highest stipend</option><option value="deadline">Closing soon</option><option value="duration">Shortest duration</option>
              </select>
            </div>
            {visibleInternships.length ? (
              <div className="internship-grid">
                {visibleInternships.map((internship) => (
                  <InternshipCard key={internship.internshipId} internship={internship} onApply={handleApply} onDetails={setSelectedInternship}
                    onToggleSave={handleToggleSave} isSaved={savedInternshipIds.includes(internship.internshipId)}
                    applied={appliedIds.has(internship.internshipId)} applying={applyingId === internship.internshipId}/>
                ))}
              </div>
            ) : <div className="empty-state"><span className="empty-icon"><Icon name="search" size={25}/></span><h3>No opportunities found</h3><p>Try a different keyword or adjust your filters.</p><button className="text-button" onClick={() => { setSearch(""); setWorkMode("all"); setMinimumMatch("0"); setStipendFilter("all"); setDurationFilter("all"); setSortBy("match"); }}>Clear filters</button></div>}
          </section>
        </>}

        {tab === "saved" && <section className="opportunities-section saved-section">
          <div className="section-heading"><div><div className="section-kicker">YOUR SHORTLIST</div><h2>Saved for later</h2></div><span className="result-count">{savedInternships.length} saved</span></div>
          {savedInternships.length ? <div className="internship-grid">
            {savedInternships.map((internship) => <InternshipCard key={internship.internshipId} internship={internship}
              onApply={handleApply} onDetails={setSelectedInternship} onToggleSave={handleToggleSave} isSaved={true}
              applied={appliedIds.has(internship.internshipId)} applying={applyingId === internship.internshipId}/>)}
          </div> : <div className="empty-state"><span className="empty-icon"><Icon name="bookmark" size={25}/></span><h3>Your saved list is empty</h3><p>Save an internship from Discover to keep it here for later.</p><button className="button button-dark" onClick={() => setTab("discover")}>Browse internships <Icon name="arrow" size={15}/></button></div>}
        </section>}

        {tab === "insights" && <section className="insights-layout">
          <div className="insight-summary-grid">
            <div className="insight-summary"><span className="section-kicker">OPPORTUNITIES ANALYSED</span><strong>{recommendations.length}</strong><small>Open internships compared with your skills</small></div>
            <div className="insight-summary"><span className="section-kicker">AVERAGE MATCH</span><strong>{averageMatch}%</strong><small>Your current skill overlap</small></div>
            <div className="insight-summary"><span className="section-kicker">PERFECT MATCHES</span><strong>{perfectMatches}</strong><small>Roles matching all listed skills</small></div>
          </div>
          <div className="insights-columns">
            <div className="side-panel">
              <div className="section-kicker">SKILLS TO EXPLORE</div><h3>Skills appearing most in your gaps</h3>
              <p>These skills are listed as requirements by internships that do not currently match your profile. Counts show how many open roles mention each skill.</p>
              {skillGapSummary.length ? <div className="gap-list">{skillGapSummary.map((entry) => <div className="gap-item" key={entry.skill}><div><b>{entry.skill}</b><small>{entry.roles.join(" · ")}</small></div><span>{entry.count} {entry.count === 1 ? "role" : "roles"}</span></div>)}</div> : <div className="insight-empty">No skill gaps are visible in the current open internship list. Add more opportunities later to broaden the analysis.</div>}
            </div>
            <div className="side-panel">
              <div className="section-kicker">YOUR CURRENT STRENGTHS</div><h3>Skills in your profile</h3>
              <div className="skill-list">{(currentStudent.skills || []).length ? currentStudent.skills.map((skill) => <span className="skill-chip matched" key={skill}>{skill}</span>) : <span className="details-muted">No skills have been added yet.</span>}</div>
              <p className="insights-tip">After learning a new skill, add it to your profile so future match scores reflect it.</p>
              <button className="button button-dark" onClick={() => { setEditingProfile(true); setProfileError(""); setTab("profile"); }}>Update my skills <Icon name="arrow" size={15}/></button>
            </div>
          </div>
        </section>}

        {tab === "profile" && <section className="profile-layout">
          {editingProfile ? <ProfileEditor student={currentStudent} skills={skills} onCancel={() => { setEditingProfile(false); setProfileError(""); }} onSave={handleUpdateProfile} busy={profileBusy} error={profileError}/> : <div className="profile-card">
            <div className="profile-banner"/>
            <div className="profile-content">
              <div className="profile-avatar">{initials(currentStudent.fullName)}</div>
              <h3>{currentStudent.fullName}</h3><p>{currentStudent.department || "Department not added"} · Class of {currentStudent.graduationYear || "Not specified"}</p>
              <div className="profile-divider"/>
              <button className="button button-outline profile-edit-trigger" onClick={() => { setEditingProfile(true); setProfileError(""); }}>Edit profile <Icon name="arrow" size={14}/></button>
              <span className="profile-label">EMAIL ADDRESS</span><div className="profile-email">{currentStudent.email}</div>
              <span className="profile-label profile-label-spaced">STUDENT ID</span><div className="profile-email">#{currentStudent.studentId}</div>
              <span className="profile-label profile-label-spaced">SKILLS ({currentStudent.skills?.length || 0})</span>
              <div className="skill-list profile-skills">{(currentStudent.skills || []).map((skill) => <span className="skill-chip matched" key={skill}>{skill}</span>)}</div>
              <p className="profile-footnote">Your account profile is stored in the application database. Keep your skills up to date to improve the relevance of your matches.</p>
            </div>
          </div>}
          <div className="profile-side">
            <div className="side-panel"><div className="section-kicker">YOUR MATCH SNAPSHOT</div><h3>Where your skills can take you</h3><div className="snapshot-number">{perfectMatches}<small> perfect matches</small></div><div className="progress-track"><span style={{ width: `${Math.min(100, averageMatch)}%` }}/></div><div className="progress-foot"><span>Average skill overlap</span><b>{averageMatch}%</b></div></div>
            <div className="side-panel"><div className="section-kicker">A LITTLE TIP</div><h3>Make your profile stronger</h3><p>Your recommendations show which requirements you already meet and which skills you could develop next. Add more skills when you have learned them.</p><button className="button button-dark" onClick={() => setTab("discover")}>See recommendations <Icon name="arrow" size={15}/></button></div>
          </div>
        </section>}

        {tab === "applications" && <section className="applications-section">
          <div className="application-toolbar">
            <div><span className="section-kicker">APPLICATION PIPELINE</span><p>{applications.length} total applications · Track each opportunity's current status</p></div>
            <select value={applicationFilter} onChange={(event) => setApplicationFilter(event.target.value)} aria-label="Filter applications by status">
              <option value="all">All statuses</option><option value="APPLIED">Applied</option><option value="UNDER_REVIEW">Under review</option><option value="SHORTLISTED">Shortlisted</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Rejected</option><option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
          {applications.length && filteredApplications.length ? <div className="applications-list">{filteredApplications.map((application) => <div className="application-row" key={application.applicationId}><div className="company-mark">{initials(application.companyName)}</div><div className="application-info"><b>{application.internshipTitle}</b><span>{application.companyName} · {new Date(application.appliedAt).toLocaleDateString("en-IN")}</span></div><span className="application-status">{application.status.replaceAll("_", " ").toLowerCase()}</span></div>)}</div> :
            <div className="empty-state"><span className="empty-icon"><Icon name="bookmark" size={25}/></span><h3>{applications.length ? "No applications in this status" : "No applications yet"}</h3><p>{applications.length ? "Choose another status to see the rest of your applications." : "Explore the internships that fit your skills and apply when you're ready."}</p><button className="button button-dark" onClick={() => applications.length ? setApplicationFilter("all") : setTab("discover")}>{applications.length ? "Show all applications" : "Explore internships"} <Icon name="arrow" size={15}/></button></div>}
        </section>}

        <section className="how-section">
          <div className="how-heading"><div className="section-kicker">SIMPLE BY DESIGN</div><h2>From skills to next steps.</h2><p>A clearer way to move from what you know to where you could go.</p></div>
          <div className="how-steps">
            <div className="how-step"><span>01</span><div className="how-step-icon"><Icon name="user" size={20}/></div><h3>Build your profile</h3><p>Bring your skills together in one place.</p></div>
            <div className="step-line"/>
            <div className="how-step"><span>02</span><div className="how-step-icon"><Icon name="spark" size={20}/></div><h3>See your match</h3><p>Understand which role requirements you meet.</p></div>
            <div className="step-line"/>
            <div className="how-step"><span>03</span><div className="how-step-icon"><Icon name="arrow" size={20}/></div><h3>Take the next step</h3><p>Explore opportunities and apply with confidence.</p></div>
          </div>
        </section>
      </main>

      <footer className="site-footer"><a className="brand footer-brand" href="#top"><span className="brand-symbol"><Icon name="spark" size={17}/></span><span>intern<span>match</span></span></a><span>Helping skills find the right opportunity.</span><span>Internship Matching System · Student project</span></footer>
      <InternshipDetails internship={selectedInternship} onClose={() => setSelectedInternship(null)} onApply={handleApply} onToggleSave={handleToggleSave}
        isSaved={selectedInternship ? savedInternshipIds.includes(selectedInternship.internshipId) : false}
        applied={selectedInternship ? appliedIds.has(selectedInternship.internshipId) : false}
        applying={selectedInternship ? applyingId === selectedInternship.internshipId : false}/>
    </div>
  );
}
