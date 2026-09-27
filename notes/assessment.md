# Assessment

This document assesses openconformity as software, as it stands at commit `2338fc0` on 28 September 2026. It has two parts that feed each other. The first reviews the requirements in `specs/requirements.md` themselves, whether each is well formed, testable and consistent with the others, and what is missing. The second is a threat analysis of the software as built, its assets, its trust boundaries, who could attack it and how, what it does about each today, and the risk that remains. The findings of both parts are ranked and sized, and a verification plan says how each control and each finding is checked, so that a later run can report how it went. The target is openconformity. Cloudflare, GitHub, draw.io and JGraph are boundaries the software depends on, and crossing them is described for what it means to the software, never planned as an attack on them.

## 1. Method

### 1.1 The requirements review

How the requirements were reviewed. The criteria a requirement is held to, its EARS pattern, whether a test could tell it true or false, whether it conflicts with another, and what its rationale says it is for. How a missing requirement was found, by walking what the software does and holds against what the requirements govern.

### 1.2 The threat analysis

How the threat analysis was done. The model followed, assets and trust boundaries first, then threat actors and the attack surface, then threats per boundary by STRIDE, then attack scenarios. How a scenario is rated, feasibility and impact each on a scale stated here, and how the two combine into a risk.

## 2. Requirements review

### 2.1 Form and testability

One row per requirement, its id, its pattern, its verdict, sound, weak or faulty, and the reason in a few words. A weak requirement is one a test could not settle or that says less than it means. A faulty one is wrong, or contradicts the software as built by design.

### 2.2 Consistency

Where two requirements pull against each other, or where one carves out an exception the other does not name. Each pair with what would resolve it.

### 2.3 Coverage

What the tests verify, by the requirement ids the test block headers name, and which requirements nothing verifies. For each uncovered one, whether it could be verified headlessly, in the browser, by reading the source, or only by review.

### 2.4 Missing requirements

Each missing requirement as text in the file's own form, with an id in the right group, the pattern tag, the statement, and the rationale in italics, ready to paste into `specs/requirements.md`. One block per requirement, and a sentence before each saying what gap it closes.

### 2.5 Changes to existing requirements

For each requirement that should change, its id, the text as it stands, the text proposed, and why.

## 3. Threat analysis

### 3.1 Assets

What an attacker could want, ranked by what its loss would cost the user. The project's content above all, then what is stored in the browser, then the integrity of the software the user runs, then the software's own reputation.

### 3.2 Trust boundaries

Every line data or code crosses into the software, and what stands on each side. The project file, the library catalogue, the drawing, the draw.io frame, browser storage, the page's own origin, the host the software is served from, and the repository the host builds from.

### 3.3 Threat actors

Who could attack, what each has and can do, and what each wants. At least a hostile author of a project file, a hostile catalogue, a hostile drawing, a compromised or impersonated editor origin, another site in the same browser, a person at the machine, a network attacker, and someone in the supply chain from the repository to the host.

### 3.4 Attack surface

Every way data or code enters the software, as a list, each with the file and line where it enters and the check it meets there.

### 3.5 Threats per boundary

For each boundary of 3.2, the six STRIDE questions, spoofing, tampering, repudiation, information disclosure, denial of service and elevation of privilege, and for each a threat or a sentence saying why none applies.

### 3.6 Attack scenarios

Each scenario written as the attacker would plan it, what it needs, the steps, and what it gains. Then what the software does today at each step, verified in the code with file and line. Then the rating by 1.2 and a verdict, blocked, mitigated or open.

### 3.7 Residual risk

The risk that remains after the controls the software has, scenario by scenario, and the one line that says what the user is asked to trust.

## 4. Findings

The findings of both parts ranked by severity, each with what it is, where it is, why it matters, what the change would be, and its size, small, medium or large. A finding that needs a requirement points at 2.4 or 2.5. A finding that needs code says which module.

## 5. Verification plan

For every control the software relies on and every finding above, what verifies it and how. By a headless test, naming the file and the block. By a source pin. By a browser drive, saying what it does and looks for. By review of a document or a setting. By a manual check that cannot be scripted, with its steps. This chapter says what is verified. Chapter 6 says how it went.

## 6. Verification results

Empty until the plan is run. One row per item of chapter 5, the date, who ran it, passed or failed, and remarks.

## 7. References

| No. | Reference | Link |
|---|---|---|
| *[1]* | *Reference*| *Link* |
