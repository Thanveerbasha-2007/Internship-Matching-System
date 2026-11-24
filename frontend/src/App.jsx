import { useEffect, useMemo, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const DEMO_STUDENTS = [
  { studentId: 1, fullName: "Aarav Sharma", email: "aarav.sharma@example.com", department: "Computer Science", graduationYear: 2027, skills: ["Java", "Spring Boot", "MySQL"] },
  { studentId: 2, fullName: "Diya Reddy", email: "diya.reddy@example.com", department: "Computer Science", graduationYear: 2027, skills: ["React", "JavaScript", "HTML", "CSS"] },
  { studentId: 3, fullName: "Kabir Mehta", email: "kabir.mehta@example.com", department: "Data Science", graduationYear: 2028, skills: ["Python", "SQL", "Machine Learning"] },
  { studentId: 4, fullName: "Nisha Verma", email: "nisha.verma@example.com", department: "Computer Science", graduationYear: 2028, skills: ["Python", "SQL", "MySQL"] },
];

const DEMO_INTERNSHIPS = [
  { internshipId: 1, title: "Backend Developer Intern", companyName: "Northstar Tech", description: "Work on Java-based backend services, REST APIs, and reliable database integration.", location: "Bengaluru", workMode: "HYBRID", durationWeeks: 12, stipendAmount: 15000, applicationDeadline: null, requiredSkills: ["Java", "Spring Boot", "MySQL"] },
  { internshipId: 2, title: "Frontend Developer Intern", companyName: "PixelSpring Labs", description: "Build responsive user interfaces and turn product ideas into accessible web experiences.", location: "Remote", workMode: "REMOTE", durationWeeks: 10, stipendAmount: 12000, applicationDeadline: null, requiredSkills: ["React", "JavaScript", "HTML", "CSS"] },
  { internshipId: 3, title: "Data Analyst Intern", companyName: "InsightWorks", description: "Explore datasets, write SQL queries, and help teams make decisions from data.", location: "Hyderabad", workMode: "ONSITE", durationWeeks: 8, stipendAmount: 10000, applicationDeadline: null, requiredSkills: ["Python", "SQL"] },
  { internshipId: 4, title: "Machine Learning Intern", companyName: "ModelBridge", description: "Work with structured datasets and build introductory machine learning models.", location: "Pune", workMode: "HYBRID", durationWeeks: 12, stipendAmount: 18000, applicationDeadline: null, requiredSkills: ["Python", "SQL", "Machine Learning"] },
];

const DEMO_SKILLS = [
  "Java", "Spring Boot", "MySQL", "React", "JavaScript",
  "HTML", "CSS", "Python", "SQL", "Machine Learning",
].map((skill, index) => ({ skillId: index + 1, skillName: skill }));

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function makeDemoRecommendations(student, internships) {
  if (!student) return [];
  const known = new Set((student.skills || []).map((skill) => skill.toLowerCase()));
  return internships.map((internship) => {
    const required = internship.requiredSkills || [];
    const matchedSkills = required.filter((skill) => known.has(skill.toLowerCase()));
    const missingSkills = required.filter((skill) => !known.has(skill.toLowerCase()));
    const matchScore = required.length
      ? Math.round((matchedSkills.length / required.length) * 1000) / 10
      : 0;
    return { ...internship, matchedSkills, missingSkills, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

function formatStipend(amount) {
  if (amount === null || amount === undefined) return "Not specified";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount) + " / month";
}

function formatDeadline(value) {
  if (!value) return "Applications open";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "See listing";
  return `Apply by ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function Icon({ name, size = 18 }) {
  const paths = {
    compass: <><circle cx="12" cy="12" r="9"/><path d="m16.2 7.8-2.5 5.9-5.9 2.5 2.5-5.9 5.9-2.5Z"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    bookmark: <><path d="M6 4h12v17l-6-4-6 4z"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></>,
    spark: <><path d="m12 3 1.6 6.4L20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.spark}</svg>;
}

function InternshipCard({ internship, onApply, applied, applying, apiOnline }) {
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
        <button className={applied ? "button button-applied" : "button button-dark"} onClick={() => onApply(internship)} disabled={applied || applying || !apiOnline}>
          {applied ? "Applied" : applying ? "Applying…" : "Apply now"} {!applied && <Icon name="arrow" size={15}/>}
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [students, setStudents] = useState(DEMO_STUDENTS);
  const [internships, setInternships] = useState(DEMO_INTERNSHIPS);
  const [skills, setSkills] = useState(DEMO_SKILLS);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("1");
  const [tab, setTab] = useState("discover");
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState("all");
  const [minimumMatch, setMinimumMatch] = useState("0");
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [notice, setNotice] = useState("");

  const selectedStudent = students.find((student) => String(student.studentId) === selectedStudentId) || students[0];

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [studentData, internshipData, skillData] = await Promise.all([
          api("/api/students"),
          api("/api/internships"),
          api("/api/skills"),
        ]);
        if (!active) return;
        setStudents(studentData);
        setInternships(internshipData);
        setSkills(skillData);
        setApiOnline(true);
        setNotice("");
        if (!studentData.some((student) => String(student.studentId) === selectedStudentId) && studentData.length) {
          setSelectedStudentId(String(studentData[0].studentId));
        }
      } catch {
        if (!active) return;
        setApiOnline(false);
        setStudents(DEMO_STUDENTS);
        setInternships(DEMO_INTERNSHIPS);
        setSkills(DEMO_SKILLS);
        setNotice("Preview mode — showing fictional sample data. Connect the API to submit applications.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadRecommendations() {
      if (!apiOnline || !selectedStudent) {
        setRecommendations(makeDemoRecommendations(selectedStudent, internships));
        return;
      }
      try {
        const data = await api(`/api/students/${selectedStudent.studentId}/recommendations`);
        if (active) setRecommendations(data);
      } catch {
        if (active) setRecommendations(makeDemoRecommendations(selectedStudent, internships));
      }
    }
    loadRecommendations();
    return () => { active = false; };
  }, [apiOnline, selectedStudent, internships]);

  useEffect(() => {
    let active = true;
    async function loadApplications() {
      if (tab !== "applications" || !apiOnline || !selectedStudent) {
        if (tab === "applications" && !apiOnline) setApplications([]);
        return;
      }
      try {
        const data = await api(`/api/students/${selectedStudent.studentId}/applications`);
        if (active) setApplications(data);
      } catch {
        if (active) setApplications([]);
      }
    }
    loadApplications();
    return () => { active = false; };
  }, [tab, apiOnline, selectedStudent]);

  const visibleInternships = useMemo(() => recommendations.filter((internship) => {
    const text = `${internship.title} ${internship.companyName} ${internship.location} ${(internship.requiredSkills || []).join(" ")}`.toLowerCase();
    const modeMatches = workMode === "all" || (internship.workMode || "").toLowerCase() === workMode;
    return text.includes(search.toLowerCase()) && modeMatches && Number(internship.matchScore || 0) >= Number(minimumMatch);
  }), [recommendations, search, workMode, minimumMatch]);

  async function handleApply(internship) {
    if (!apiOnline || !selectedStudent) return;
    setApplyingId(internship.internshipId);
    setNotice("");
    try {
      await api("/api/applications", {
        method: "POST",
        body: JSON.stringify({ studentId: selectedStudent.studentId, internshipId: internship.internshipId }),
      });
      setNotice(`Your application for ${internship.title} has been recorded.`);
      const data = await api(`/api/students/${selectedStudent.studentId}/applications`);
      setApplications(data);
      setTab("applications");
    } catch (error) {
      setNotice(error.message.includes("409")
        ? "You have already applied to this internship."
        : "The application could not be submitted. Please check the API and try again.");
    } finally {
      setApplyingId(null);
    }
  }

  const appliedIds = new Set(applications.map((application) => application.internshipId));
  const perfectMatches = recommendations.filter((item) => Number(item.matchScore) === 100).length;
  const averageMatch = recommendations.length
    ? Math.round(recommendations.reduce((sum, item) => sum + Number(item.matchScore || 0), 0) / recommendations.length)
    : 0;

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
          <button className={tab === "applications" ? "nav-link active" : "nav-link"} onClick={() => setTab("applications")}><Icon name="bookmark" size={16}/> Applications</button>
        </nav>
        <div className="header-user">
          <select aria-label="Select demo student" value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
            {students.map((student) => <option key={student.studentId} value={student.studentId}>{student.fullName}</option>)}
          </select>
          <div className="avatar">{initials(selectedStudent?.fullName)}</div>
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

        {notice && <div className={apiOnline ? "notice notice-info" : "notice notice-warning"}>{notice}</div>}

        <section className="welcome-row">
          <div>
            <div className="section-kicker">YOUR OPPORTUNITY SPACE</div>
            <h2>{tab === "discover" ? `A good next step, ${(selectedStudent?.fullName || "there").split(" ")[0]}.` : tab === "profile" ? "Your skill profile" : "Your applications"}</h2>
            <p>{tab === "discover" ? "A shortlist shaped around the skills you already have." : tab === "profile" ? "The skills in your profile help us find relevant roles." : "Keep track of the opportunities you've applied to."}</p>
          </div>
          <div className="mode-indicator"><span className={apiOnline ? "status-light live" : "status-light"}/>{apiOnline ? "Connected to live API" : "Demo preview"}</div>
        </section>

        {tab === "discover" && <>
          <section className="stats-grid">
            <div className="stat-card"><span className="stat-icon violet"><Icon name="briefcase"/></span><span className="stat-value">{internships.length}</span><span className="stat-label">Open opportunities</span></div>
            <div className="stat-card"><span className="stat-icon peach"><Icon name="spark"/></span><span className="stat-value">{perfectMatches}</span><span className="stat-label">Perfect skill matches</span></div>
            <div className="stat-card"><span className="stat-icon mint"><Icon name="code"/></span><span className="stat-value">{selectedStudent?.skills?.length || 0}</span><span className="stat-label">Skills in your profile</span></div>
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
            </div>
            {loading ? <div className="empty-state"><div className="loader"/><p>Finding opportunities for you…</p></div> : visibleInternships.length ? (
              <div className="internship-grid">
                {visibleInternships.map((internship) => (
                  <InternshipCard key={internship.internshipId} internship={internship} onApply={handleApply}
                    applied={appliedIds.has(internship.internshipId)} applying={applyingId === internship.internshipId} apiOnline={apiOnline}/>
                ))}
              </div>
            ) : <div className="empty-state"><span className="empty-icon"><Icon name="search" size={25}/></span><h3>No opportunities found</h3><p>Try a different keyword or adjust your filters.</p><button className="text-button" onClick={() => { setSearch(""); setWorkMode("all"); setMinimumMatch("0"); }}>Clear filters</button></div>}
          </section>
        </>}

        {tab === "profile" && <section className="profile-layout">
          <div className="profile-card">
            <div className="profile-banner"/>
            <div className="profile-content">
              <div className="profile-avatar">{initials(selectedStudent?.fullName)}</div>
              <h3>{selectedStudent?.fullName}</h3><p>{selectedStudent?.department || "Student"} · Class of {selectedStudent?.graduationYear || "—"}</p>
              <div className="profile-divider"/>
              <span className="profile-label">CONTACT</span><div className="profile-email">{selectedStudent?.email}</div>
              <span className="profile-label profile-label-spaced">SKILLS ({selectedStudent?.skills?.length || 0})</span>
              <div className="skill-list profile-skills">{(selectedStudent?.skills || []).map((skill) => <span className="skill-chip matched" key={skill}>{skill}</span>)}</div>
              <p className="profile-footnote">This project preview uses fictional sample profiles. Profile editing and account sign-in are not enabled yet.</p>
            </div>
          </div>
          <div className="profile-side">
            <div className="side-panel"><div className="section-kicker">YOUR MATCH SNAPSHOT</div><h3>Where your skills can take you</h3><div className="snapshot-number">{perfectMatches}<small> perfect matches</small></div><div className="progress-track"><span style={{ width: `${Math.min(100, averageMatch)}%` }}/></div><div className="progress-foot"><span>Average skill overlap</span><b>{averageMatch}%</b></div></div>
            <div className="side-panel"><div className="section-kicker">A LITTLE TIP</div><h3>Make your profile stronger</h3><p>Add projects and practical experience as the platform grows. A clearer skill profile helps you understand which requirements you already meet and what to learn next.</p><button className="button button-dark" onClick={() => setTab("discover")}>See recommendations <Icon name="arrow" size={15}/></button></div>
          </div>
        </section>}

        {tab === "applications" && <section className="applications-section">
          {!apiOnline ? <div className="empty-state"><span className="empty-icon"><Icon name="bookmark" size={25}/></span><h3>Applications need a connected API</h3><p>You're viewing sample data. Connect the backend to submit and save applications.</p></div> :
            applications.length ? <div className="applications-list">{applications.map((application) => <div className="application-row" key={application.applicationId}><div className="company-mark">{initials(application.companyName)}</div><div className="application-info"><b>{application.internshipTitle}</b><span>{application.companyName} · {new Date(application.appliedAt).toLocaleDateString("en-IN")}</span></div><span className="application-status">{application.status.replaceAll("_", " ").toLowerCase()}</span></div>)}</div> :
            <div className="empty-state"><span className="empty-icon"><Icon name="bookmark" size={25}/></span><h3>No applications yet</h3><p>Explore the internships that fit your skills and apply when the backend is connected.</p><button className="button button-dark" onClick={() => setTab("discover")}>Explore internships <Icon name="arrow" size={15}/></button></div>}
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
    </div>
  );
}
