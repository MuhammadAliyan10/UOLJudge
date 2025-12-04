--
-- PostgreSQL database dump
--

\restrict tL0e7DBg4iPkrn3MfdBeIJGfEStqutHCbYSdmwGq6NienSE4pLVFxgotJHu5Ghi

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: Category; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."Category" AS ENUM (
    'CORE',
    'WEB',
    'ANDROID'
);


ALTER TYPE public."Category" OWNER TO admin;

--
-- Name: Difficulty; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."Difficulty" AS ENUM (
    'EASY',
    'MEDIUM',
    'HARD'
);


ALTER TYPE public."Difficulty" OWNER TO admin;

--
-- Name: LogAction; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."LogAction" AS ENUM (
    'LOGIN',
    'SUBMISSION',
    'MANUAL_GRADE_UPDATE',
    'BAN_USER',
    'CONTEST_UPDATE',
    'RESTORE_SCORE'
);


ALTER TYPE public."LogAction" OWNER TO admin;

--
-- Name: ProblemType; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."ProblemType" AS ENUM (
    'PHYSICAL',
    'DIGITAL'
);


ALTER TYPE public."ProblemType" OWNER TO admin;

--
-- Name: SubmissionStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."SubmissionStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED'
);


ALTER TYPE public."SubmissionStatus" OWNER TO admin;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'JURY',
    'PARTICIPANT'
);


ALTER TYPE public."UserRole" OWNER TO admin;

--
-- Name: Verdict; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."Verdict" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'RUNTIME_ERROR',
    'COMPILE_ERROR'
);


ALTER TYPE public."Verdict" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Announcement; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Announcement" (
    id text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    contest_id text NOT NULL
);


ALTER TABLE public."Announcement" OWNER TO admin;

--
-- Name: Clarification; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Clarification" (
    id text NOT NULL,
    question text NOT NULL,
    answer text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    problem_id text,
    user_id text NOT NULL,
    answered_by_id text
);


ALTER TABLE public."Clarification" OWNER TO admin;

--
-- Name: Contest; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Contest" (
    id text NOT NULL,
    name text NOT NULL,
    start_time timestamp(3) without time zone NOT NULL,
    end_time timestamp(3) without time zone NOT NULL,
    is_paused boolean DEFAULT false NOT NULL,
    paused_at timestamp(3) without time zone,
    is_frozen boolean DEFAULT false NOT NULL,
    frozen_at timestamp(3) without time zone,
    is_active boolean DEFAULT true NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    safe_zone_minutes integer DEFAULT 30 NOT NULL,
    penalty_rate double precision DEFAULT 0.5 NOT NULL,
    min_score_percent integer DEFAULT 50 NOT NULL,
    category public."Category" DEFAULT 'CORE'::public."Category" NOT NULL
);


ALTER TABLE public."Contest" OWNER TO admin;

--
-- Name: ContestRegistration; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ContestRegistration" (
    id text NOT NULL,
    user_id text NOT NULL,
    contest_id text NOT NULL,
    registered_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ContestRegistration" OWNER TO admin;

--
-- Name: Problem; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Problem" (
    id text NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category public."Category" NOT NULL,
    type public."ProblemType" DEFAULT 'PHYSICAL'::public."ProblemType" NOT NULL,
    content_url text,
    points integer DEFAULT 100 NOT NULL,
    difficulty public."Difficulty" DEFAULT 'MEDIUM'::public."Difficulty" NOT NULL,
    time_limit double precision DEFAULT 2.0 NOT NULL,
    memory_limit_mb integer DEFAULT 256,
    assets_path text,
    contest_id text NOT NULL
);


ALTER TABLE public."Problem" OWNER TO admin;

--
-- Name: Submission; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Submission" (
    id text NOT NULL,
    file_path text NOT NULL,
    file_hash text NOT NULL,
    language text NOT NULL,
    verdict public."SubmissionStatus" DEFAULT 'PENDING'::public."SubmissionStatus" NOT NULL,
    is_latest boolean DEFAULT true NOT NULL,
    can_retry boolean DEFAULT false NOT NULL,
    retry_requested boolean DEFAULT false NOT NULL,
    retry_reason text,
    retry_requested_at timestamp(3) without time zone,
    retry_granted_by text,
    auto_score integer DEFAULT 0 NOT NULL,
    manual_score integer,
    final_score integer DEFAULT 0 NOT NULL,
    penalty integer DEFAULT 0 NOT NULL,
    submitted_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id text NOT NULL,
    problem_id text NOT NULL,
    judged_by_id text,
    jury_comment text
);


ALTER TABLE public."Submission" OWNER TO admin;

--
-- Name: SystemLog; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."SystemLog" (
    id text NOT NULL,
    action public."LogAction" NOT NULL,
    details text NOT NULL,
    ip_address text,
    level text DEFAULT 'INFO'::text NOT NULL,
    message text DEFAULT ''::text NOT NULL,
    metadata jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    submission_id text,
    user_id text
);


ALTER TABLE public."SystemLog" OWNER TO admin;

--
-- Name: User; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."User" (
    id text NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    role public."UserRole" DEFAULT 'PARTICIPANT'::public."UserRole" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO admin;

--
-- Name: jury_assignment; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.jury_assignment (
    id text NOT NULL,
    user_id text NOT NULL,
    contest_id text NOT NULL,
    assigned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.jury_assignment OWNER TO admin;

--
-- Name: system_setting; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.system_setting (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.system_setting OWNER TO admin;

--
-- Name: team_profile; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.team_profile (
    id text NOT NULL,
    user_id text NOT NULL,
    display_name text NOT NULL,
    members jsonb DEFAULT '[]'::jsonb NOT NULL,
    lab_location text,
    category public."Category" NOT NULL,
    total_score integer DEFAULT 0 NOT NULL,
    total_penalty integer DEFAULT 0 NOT NULL,
    rank integer,
    is_active boolean DEFAULT true NOT NULL,
    "isBlocked" boolean DEFAULT false NOT NULL,
    assigned_contest_id text,
    max_devices integer DEFAULT 2 NOT NULL,
    authorized_devices jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.team_profile OWNER TO admin;

--
-- Name: team_score; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.team_score (
    id text NOT NULL,
    team_id text NOT NULL,
    contest_id text NOT NULL,
    solved_count integer DEFAULT 0 NOT NULL,
    total_score integer DEFAULT 0 NOT NULL,
    total_penalty integer DEFAULT 0 NOT NULL,
    problem_stats jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.team_score OWNER TO admin;

--
-- Data for Name: Announcement; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Announcement" (id, title, message, created_at, contest_id) FROM stdin;
\.


--
-- Data for Name: Clarification; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Clarification" (id, question, answer, created_at, updated_at, problem_id, user_id, answered_by_id) FROM stdin;
\.


--
-- Data for Name: Contest; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Contest" (id, name, start_time, end_time, is_paused, paused_at, is_frozen, frozen_at, is_active, config, safe_zone_minutes, penalty_rate, min_score_percent, category) FROM stdin;
1a3ccf14-2ece-438f-9388-915ef89469f7	Speed Programming	2025-12-04 04:35:00	2025-12-04 07:28:59.364	f	\N	f	\N	t	{}	30	0.5	50	CORE
\.


--
-- Data for Name: ContestRegistration; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ContestRegistration" (id, user_id, contest_id, registered_at) FROM stdin;
\.


--
-- Data for Name: Problem; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Problem" (id, order_index, title, description, category, type, content_url, points, difficulty, time_limit, memory_limit_mb, assets_path, contest_id) FROM stdin;
ada9c24c-a1ea-4d5a-a7e8-579f1da440c8	0	Problem A	Please refer to the physical question paper provided.	CORE	PHYSICAL	\N	100	MEDIUM	2	256	\N	1a3ccf14-2ece-438f-9388-915ef89469f7
9251bee7-4919-4177-8591-c9aa9f74ba28	1	Problem B	Please refer to the physical question paper provided.	CORE	PHYSICAL	\N	100	MEDIUM	2	256	\N	1a3ccf14-2ece-438f-9388-915ef89469f7
99a02a8f-eb37-4e3e-a708-b8ec98683e64	2	Problem C	Please refer to the physical question paper provided.	CORE	PHYSICAL	\N	100	MEDIUM	2	256	\N	1a3ccf14-2ece-438f-9388-915ef89469f7
\.


--
-- Data for Name: Submission; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Submission" (id, file_path, file_hash, language, verdict, is_latest, can_retry, retry_requested, retry_reason, retry_requested_at, retry_granted_by, auto_score, manual_score, final_score, penalty, submitted_at, user_id, problem_id, judged_by_id, jury_comment) FROM stdin;
\.


--
-- Data for Name: SystemLog; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."SystemLog" (id, action, details, ip_address, level, message, metadata, "timestamp", submission_id, user_id) FROM stdin;
fa45fffd-d1f6-45f2-913b-cecb019a55bf	MANUAL_GRADE_UPDATE	Assigned to 1 contest(s)	\N	INFO	Created jury member: hashir	{"action": "CREATE_JURY", "contestIds": ["214228c2-bcd5-4136-9878-9ef4611668ce"]}	2025-12-03 05:02:12.383	\N	\N
75873255-3cff-4686-86da-f1925fa4d47c	MANUAL_GRADE_UPDATE	Jury hashir changed score from PENDING to ACCEPTED. Reason: Appove	\N	INFO	Graded submission: ACCEPTED (Score: 80)	{"score": 80, "teamId": "2d74dcda-5f97-4d52-a70e-9d0e0f01a510", "verdict": "ACCEPTED", "isRegrade": false, "newStatus": "ACCEPTED", "oldStatus": "PENDING", "problemId": "555bb43e-b136-4ddc-8ca6-1d47c8fcd268", "juryComment": "Appove", "solvedCount": 1, "totalPenalty": 3, "previousJuryId": null}	2025-12-03 05:03:32.519	76678187-8f18-41dc-a545-8c62460b3f93	\N
037a49d3-7e60-4927-81e8-62f140b788aa	MANUAL_GRADE_UPDATE	Jury hashir changed score from ACCEPTED to ACCEPTED. (Previously graded by hashir) Reason: Appove	\N	INFO	RE-GRADED submission: ACCEPTED (Score: 50)	{"score": 50, "teamId": "2d74dcda-5f97-4d52-a70e-9d0e0f01a510", "verdict": "ACCEPTED", "isRegrade": true, "newStatus": "ACCEPTED", "oldStatus": "ACCEPTED", "problemId": "555bb43e-b136-4ddc-8ca6-1d47c8fcd268", "juryComment": "Appove", "solvedCount": 1, "totalPenalty": 3, "previousJuryId": "51a28a1b-ccc0-4067-83c4-6ebc6949eb0d"}	2025-12-03 05:04:07.803	76678187-8f18-41dc-a545-8c62460b3f93	\N
baf81b0c-f894-47d3-ad90-a4725becbfde	MANUAL_GRADE_UPDATE	Jury hashir changed score from PENDING to ACCEPTED. Reason: Approve	\N	INFO	Graded submission: ACCEPTED (Score: 54)	{"score": 54, "teamId": "2d74dcda-5f97-4d52-a70e-9d0e0f01a510", "verdict": "ACCEPTED", "isRegrade": false, "newStatus": "ACCEPTED", "oldStatus": "PENDING", "problemId": "2a217ef2-3e5a-47a2-9aa0-2330bfb4478c", "juryComment": "Approve", "solvedCount": 2, "totalPenalty": 9, "previousJuryId": null}	2025-12-03 05:07:09.92	9642ce21-b61a-49b6-b32c-c64447f1a283	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."User" (id, username, password_hash, role, is_active, created_at) FROM stdin;
9c35f3cf-cb61-4780-9696-dbb194439dfc	admin	$2b$10$crtWpVZ6ONlc00Dm5rB.C.pH66ju5Si.XktMAuDNnzm1w/GjobE0u	ADMIN	t	2025-12-03 04:55:27.092
\.


--
-- Data for Name: jury_assignment; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.jury_assignment (id, user_id, contest_id, assigned_at) FROM stdin;
\.


--
-- Data for Name: system_setting; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.system_setting (id, key, value, description, "updatedAt") FROM stdin;
\.


--
-- Data for Name: team_profile; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.team_profile (id, user_id, display_name, members, lab_location, category, total_score, total_penalty, rank, is_active, "isBlocked", assigned_contest_id, max_devices, authorized_devices) FROM stdin;
\.


--
-- Data for Name: team_score; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.team_score (id, team_id, contest_id, solved_count, total_score, total_penalty, problem_stats, updated_at) FROM stdin;
\.


--
-- Name: Announcement Announcement_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_pkey" PRIMARY KEY (id);


--
-- Name: Clarification Clarification_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Clarification"
    ADD CONSTRAINT "Clarification_pkey" PRIMARY KEY (id);


--
-- Name: ContestRegistration ContestRegistration_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ContestRegistration"
    ADD CONSTRAINT "ContestRegistration_pkey" PRIMARY KEY (id);


--
-- Name: Contest Contest_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Contest"
    ADD CONSTRAINT "Contest_pkey" PRIMARY KEY (id);


--
-- Name: Problem Problem_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Problem"
    ADD CONSTRAINT "Problem_pkey" PRIMARY KEY (id);


--
-- Name: Submission Submission_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Submission"
    ADD CONSTRAINT "Submission_pkey" PRIMARY KEY (id);


--
-- Name: SystemLog SystemLog_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."SystemLog"
    ADD CONSTRAINT "SystemLog_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: jury_assignment jury_assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.jury_assignment
    ADD CONSTRAINT jury_assignment_pkey PRIMARY KEY (id);


--
-- Name: system_setting system_setting_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.system_setting
    ADD CONSTRAINT system_setting_pkey PRIMARY KEY (id);


--
-- Name: team_profile team_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.team_profile
    ADD CONSTRAINT team_profile_pkey PRIMARY KEY (id);


--
-- Name: team_score team_score_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.team_score
    ADD CONSTRAINT team_score_pkey PRIMARY KEY (id);


--
-- Name: ContestRegistration_user_id_contest_id_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "ContestRegistration_user_id_contest_id_key" ON public."ContestRegistration" USING btree (user_id, contest_id);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: jury_assignment_contest_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX jury_assignment_contest_id_idx ON public.jury_assignment USING btree (contest_id);


--
-- Name: jury_assignment_user_id_contest_id_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX jury_assignment_user_id_contest_id_key ON public.jury_assignment USING btree (user_id, contest_id);


--
-- Name: jury_assignment_user_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX jury_assignment_user_id_idx ON public.jury_assignment USING btree (user_id);


--
-- Name: system_setting_key_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX system_setting_key_key ON public.system_setting USING btree (key);


--
-- Name: team_profile_assigned_contest_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX team_profile_assigned_contest_id_idx ON public.team_profile USING btree (assigned_contest_id);


--
-- Name: team_profile_category_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX team_profile_category_idx ON public.team_profile USING btree (category);


--
-- Name: team_profile_user_id_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX team_profile_user_id_key ON public.team_profile USING btree (user_id);


--
-- Name: team_score_contest_id_solved_count_total_score_total_penalt_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX team_score_contest_id_solved_count_total_score_total_penalt_idx ON public.team_score USING btree (contest_id, solved_count DESC, total_score DESC, total_penalty);


--
-- Name: team_score_team_id_contest_id_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX team_score_team_id_contest_id_key ON public.team_score USING btree (team_id, contest_id);


--
-- Name: team_score_team_id_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX team_score_team_id_key ON public.team_score USING btree (team_id);


--
-- Name: Announcement Announcement_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_contest_id_fkey" FOREIGN KEY (contest_id) REFERENCES public."Contest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Clarification Clarification_answered_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Clarification"
    ADD CONSTRAINT "Clarification_answered_by_id_fkey" FOREIGN KEY (answered_by_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Clarification Clarification_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Clarification"
    ADD CONSTRAINT "Clarification_problem_id_fkey" FOREIGN KEY (problem_id) REFERENCES public."Problem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Clarification Clarification_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Clarification"
    ADD CONSTRAINT "Clarification_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ContestRegistration ContestRegistration_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ContestRegistration"
    ADD CONSTRAINT "ContestRegistration_contest_id_fkey" FOREIGN KEY (contest_id) REFERENCES public."Contest"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ContestRegistration ContestRegistration_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ContestRegistration"
    ADD CONSTRAINT "ContestRegistration_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Problem Problem_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Problem"
    ADD CONSTRAINT "Problem_contest_id_fkey" FOREIGN KEY (contest_id) REFERENCES public."Contest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Submission Submission_judged_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Submission"
    ADD CONSTRAINT "Submission_judged_by_id_fkey" FOREIGN KEY (judged_by_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Submission Submission_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Submission"
    ADD CONSTRAINT "Submission_problem_id_fkey" FOREIGN KEY (problem_id) REFERENCES public."Problem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Submission Submission_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Submission"
    ADD CONSTRAINT "Submission_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SystemLog SystemLog_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."SystemLog"
    ADD CONSTRAINT "SystemLog_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: jury_assignment jury_assignment_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.jury_assignment
    ADD CONSTRAINT jury_assignment_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public."Contest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jury_assignment jury_assignment_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.jury_assignment
    ADD CONSTRAINT jury_assignment_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: team_profile team_profile_assigned_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.team_profile
    ADD CONSTRAINT team_profile_assigned_contest_id_fkey FOREIGN KEY (assigned_contest_id) REFERENCES public."Contest"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: team_profile team_profile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.team_profile
    ADD CONSTRAINT team_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: team_score team_score_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.team_score
    ADD CONSTRAINT team_score_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public."Contest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: team_score team_score_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.team_score
    ADD CONSTRAINT team_score_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team_profile(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict tL0e7DBg4iPkrn3MfdBeIJGfEStqutHCbYSdmwGq6NienSE4pLVFxgotJHu5Ghi

