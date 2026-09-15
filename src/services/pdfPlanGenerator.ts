/**
 * HELP150 — Official Business Plan PDF Generator
 * Generates an executive 12-slide presentation PDF in high-definition landscape format.
 * Matches the official HELP150 business presentation slides.
 */

import { jsPDF } from 'jspdf';

export function generateHelp150PlanPdf(): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4', // 297 x 210 mm
  });

  const width = 297;
  const height = 210;

  // Helper: Draw Slide Header & Background
  const drawBackground = (slideNum: number, totalSlides = 12) => {
    // Dark luxury gradient imitation
    doc.setFillColor(8, 12, 29); // #080C1D
    doc.rect(0, 0, width, height, 'F');

    // Subtle golden corner border accents
    doc.setDrawColor(212, 175, 55); // #D4AF37 Gold
    doc.setLineWidth(0.8);
    doc.roundedRect(6, 6, width - 12, height - 12, 4, 4, 'S');

    // Top Brand Banner Line
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(6, 6, width - 12, 14, 'F');
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.4);
    doc.line(6, 20, width - 6, 20);

    // Top Header text
    doc.setTextColor(255, 215, 0); // Gold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('HELP150 — OFFICIAL COMMUNITY MUTUAL HELP PLAN', 14, 15);

    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('www.help150.org', width / 2, 15, { align: 'center' });
    doc.text(`Slide ${slideNum} of ${totalSlides}`, width - 14, 15, { align: 'right' });

    // Bottom Footer Banner
    doc.setFillColor(12, 18, 38);
    doc.rect(6, height - 16, width - 12, 10, 'F');
    doc.setDrawColor(212, 175, 55);
    doc.line(6, height - 16, width - 6, height - 16);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(7.5);
    doc.text(
      'HELP150 is a peer-to-peer voluntary community mutual assistance portal. Direct Member-to-Member UPI Transfers. Terms apply.',
      14,
      height - 10
    );

    doc.setTextColor(251, 191, 36);
    doc.setFont('helvetica', 'bold');
    doc.text('“Together For A Better Tomorrow”', width - 14, height - 10, { align: 'right' });
  };

  // Helper: Card Box
  const drawCard = (x: number, y: number, w: number, h: number, title?: string, borderColor?: [number, number, number]) => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    if (borderColor) {
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    } else {
      doc.setDrawColor(51, 65, 85);
    }
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, w, h, 3, 3, 'S');

    if (title) {
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(x, y, w, 8, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(title, x + 4, y + 5.5);
    }
  };

  // ==========================================
  // SLIDE 1: WELCOME COVER
  // ==========================================
  drawBackground(1);

  // Center Emblem ring
  doc.setFillColor(245, 158, 11); // Amber
  doc.circle(width / 2, 60, 22, 'F');
  doc.setFillColor(15, 23, 42);
  doc.circle(width / 2, 60, 19, 'F');
  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('H150', width / 2, 63, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text('COMMUNITY', width / 2, 69, { align: 'center' });

  // Main Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('WELCOME TO HELP150', width / 2, 98, { align: 'center' });

  doc.setTextColor(251, 191, 36);
  doc.setFontSize(14);
  doc.text('“Together For A Better Tomorrow”', width / 2, 108, { align: 'center' });

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('A Transparent Peer-to-Peer Community Mutual Assistance Platform', width / 2, 116, { align: 'center' });

  // 3 Golden Highlights
  const pillW = 75;
  const pillY = 130;
  drawCard(22, pillY, pillW, 36, undefined, [239, 68, 68]);
  doc.setTextColor(248, 113, 113);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PLAN VALUE', 22 + pillW / 2, pillY + 12, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Rs. 150', 22 + pillW / 2, pillY + 24, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('(50 Verification + 100 Second)', 22 + pillW / 2, pillY + 31, { align: 'center' });

  drawCard(111, pillY, pillW, 36, undefined, [59, 130, 246]);
  doc.setTextColor(96, 165, 250);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('HELP CYCLE', 111 + pillW / 2, pillY + 12, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('12-HOUR TIMER', 111 + pillW / 2, pillY + 24, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Server Controlled Maturation', 111 + pillW / 2, pillY + 31, { align: 'center' });

  drawCard(200, pillY, pillW, 36, undefined, [16, 185, 129]);
  doc.setTextColor(52, 211, 153);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('STATED RECEIVE', 200 + pillW / 2, pillY + 12, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Rs. 200', 200 + pillW / 2, pillY + 24, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('+Rs. 50 Net Gain per cycle', 200 + pillW / 2, pillY + 31, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Official Presentation • Joining Success • Direct UPI / Bank Settlement', width / 2, 180, { align: 'center' });

  // ==========================================
  // SLIDE 2: HELP & SUPPORT PLAN OVERVIEW
  // ==========================================
  doc.addPage();
  drawBackground(2);

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('HELP 150 — PLAN OVERVIEW', 14, 32);

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Complete Breakdown of the Rs. 150 Community Assistance Model', 14, 38);

  // Left Card: Core Concept
  drawCard(14, 46, 128, 134, 'WHAT IS HELP150?', [212, 175, 55]);
  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  const conceptPoints = [
    '• 100% Peer-to-Peer (P2P) direct community assistance.',
    '• No central company bank account holding member funds.',
    '• All payments made directly from member UPI to member UPI.',
    '• Plan entry is split into two manageable steps:',
    '   - Step 1: Verification Link (Rs. 50)',
    '   - Step 2: Second Help Link (Rs. 100)',
    '   - Total Help Provided: Exactly Rs. 150 per cycle.',
    '• Automatic 12-Hour Maturation countdown after verification.',
    '• Direct Receive Help of Rs. 200 deposited into your bank/UPI.',
    '• Member may continue to next cycle (Re-entry) or exit freely.',
    '• Re-entering yields Rs. 50 net benefit consistently per cycle.',
  ];
  let curY = 60;
  conceptPoints.forEach((pt) => {
    doc.text(pt, 20, curY);
    curY += 7.2;
  });

  // Right Card: Visual Flow
  drawCard(152, 46, 130, 134, 'THE 2-STEP PROVIDE HELP PROCESS', [59, 130, 246]);

  // Step 1 sub-box
  drawCard(160, 58, 114, 34, undefined, [239, 68, 68]);
  doc.setTextColor(248, 113, 113);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('STEP 1: PROVIDE HELP (Rs. 50)', 166, 68);
  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Verification link assigned upon joining. Pay Rs. 50 directly via UPI,', 166, 75);
  doc.text('submit 12-digit UTR reference & slip to activate your account.', 166, 81);

  // Step 2 sub-box
  drawCard(160, 98, 114, 34, undefined, [245, 158, 11]);
  doc.setTextColor(251, 191, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('STEP 2: PROVIDE HELP (Rs. 100)', 166, 108);
  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Second link unlocks after Step 1 is confirmed. Pay Rs. 100 to peer,', 166, 115);
  doc.text('upload proof. Completes your Rs. 150 community contribution.', 166, 121);

  // Total summary badge
  drawCard(160, 138, 114, 32, undefined, [16, 185, 129]);
  doc.setTextColor(52, 211, 153);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL HELP PROVIDED: Rs. 150', 166, 150);
  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Step 1 (Rs. 50) + Step 2 (Rs. 100) = Rs. 150 Total Assistance.', 166, 158);
  doc.text('Triggers the automated 12-Hour Server Maturation countdown!', 166, 164);

  // ==========================================
  // SLIDE 3: 12-HOUR CYCLE & RECEIVE HELP
  // ==========================================
  doc.addPage();
  drawBackground(3);

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('12-HOUR HELP CYCLE & RECEIVE ASSISTANCE', 14, 32);

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Server-Synchronized 12-Hour Maturation & Stated Rs. 200 Payout', 14, 38);

  // Big 3 Steps across screen
  const stepColW = 85;
  // Box 1: Maturation Timer
  drawCard(14, 48, stepColW, 110, '1. 12-HOUR MATURATION', [245, 158, 11]);
  doc.setTextColor(251, 191, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('12:00:00', 14 + stepColW / 2, 75, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.text('Server-side countdown starts immediately', 14 + stepColW / 2, 85, { align: 'center' });
  doc.text('when both Rs. 50 & Rs. 100 receipts', 14 + stepColW / 2, 92, { align: 'center' });
  doc.text('are verified by the receivers.', 14 + stepColW / 2, 99, { align: 'center' });
  doc.text('Clock continues accurately across all', 14 + stepColW / 2, 110, { align: 'center' });
  doc.text('browser refreshes & device changes.', 14 + stepColW / 2, 117, { align: 'center' });

  // Box 2: Receive Help Link
  drawCard(106, 48, stepColW, 110, '2. RECEIVE HELP LINK', [59, 130, 246]);
  doc.setTextColor(96, 165, 250);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Rs. 200', 106 + stepColW / 2, 75, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.text('Once 12-hour timer reaches 00:00:00,', 106 + stepColW / 2, 85, { align: 'center' });
  doc.text('system matches you to receive Rs. 200.', 106 + stepColW / 2, 92, { align: 'center' });
  doc.text('Payment is transferred directly to your', 106 + stepColW / 2, 99, { align: 'center' });
  doc.text('bank account and UPI ID.', 106 + stepColW / 2, 106, { align: 'center' });
  doc.text('Receiver verifies payment slip & confirms.', 106 + stepColW / 2, 117, { align: 'center' });

  // Box 3: Continue or Exit
  drawCard(198, 48, stepColW, 110, '3. REVOLVING RE-ENTRY', [16, 185, 129]);
  doc.setTextColor(52, 211, 153);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('+Rs. 50 GAIN', 198 + stepColW / 2, 75, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.text('Received: Rs. 200', 198 + stepColW / 2, 85, { align: 'center' });
  doc.text('Provide Next Cycle: Rs. 150', 198 + stepColW / 2, 92, { align: 'center' });
  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Net Community Benefit: +Rs. 50', 198 + stepColW / 2, 104, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Continuous cycle allows steady community', 198 + stepColW / 2, 115, { align: 'center' });
  doc.text('growth with zero hidden costs.', 198 + stepColW / 2, 122, { align: 'center' });

  // Statutory Note Box at bottom
  drawCard(14, 164, 269, 18, undefined, [239, 68, 68]);
  doc.setTextColor(248, 113, 113);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(
    '* Rs. 200 is a stated community program outcome, not a guaranteed financial return or interest rate. Actual eligibility depends on program rules.',
    width / 2,
    174,
    { align: 'center' }
  );

  // ==========================================
  // SLIDE 4: 6-STEP MEMBER JOURNEY
  // ==========================================
  doc.addPage();
  drawBackground(4);

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MEMBER JOURNEY — STEP BY STEP', 14, 32);

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('How Every Member Navigates the HELP150 Community', 14, 38);

  const journeySteps = [
    { num: '1', title: 'Register Free', desc: 'Sign up with mobile & email. Unique H150 User ID is assigned immediately.' },
    { num: '2', title: 'Understand Rules', desc: 'Review community guidelines, mutual help ethos, and non-guarantee ethics.' },
    { num: '3', title: 'Provide Help (Rs. 150)', desc: 'Complete Step 1 (Rs. 50) and Step 2 (Rs. 100) direct peer payments.' },
    { num: '4', title: 'Submit UTR & Slip', desc: 'Upload bank UTR and receipt slip for receiver verification.' },
    { num: '5', title: '12-Hour Maturation', desc: 'Server clock runs 12:00:00 to ensure disciplined community pacing.' },
    { num: '6', title: 'Receive Rs. 200 & Loop', desc: 'Receive Rs. 200 help, accept receipt, and choose to re-enter Cycle #2.' },
  ];

  const jCardW = 128;
  const jCardH = 34;
  journeySteps.forEach((st, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const jx = col === 0 ? 14 : 152;
    const jy = 48 + row * 41;

    drawCard(jx, jy, jCardW, jCardH, undefined, [212, 175, 55]);

    // Step circle
    doc.setFillColor(245, 158, 11);
    doc.circle(jx + 12, jy + jCardH / 2, 7, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(st.num, jx + 12, jy + jCardH / 2 + 3.5, { align: 'center' });

    // Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(st.title, jx + 24, jy + 11);

    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(st.desc, jx + 24, jy + 19);
  });

  // ==========================================
  // SLIDE 5: 6-LEVEL SUPPORT REWARD STRUCTURE
  // ==========================================
  doc.addPage();
  drawBackground(5);

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('6-LEVEL SUPPORT STRUCTURE & REFERRAL REWARDS', 14, 32);

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Earn Automated Rewards Across 6 Generations of Your Team', 14, 38);

  const levels = [
    { lvl: 'Level 1 (Direct)', pct: '5.0%', perHelp: 'Rs. 7.50', teamReq: '0 Directs Required', color: [239, 68, 68] as [number, number, number] },
    { lvl: 'Level 2', pct: '4.0%', perHelp: 'Rs. 6.00', teamReq: '1 Direct Member', color: [245, 158, 11] as [number, number, number] },
    { lvl: 'Level 3', pct: '3.0%', perHelp: 'Rs. 4.50', teamReq: '2 Direct Members', color: [16, 185, 129] as [number, number, number] },
    { lvl: 'Level 4', pct: '2.0%', perHelp: 'Rs. 3.00', teamReq: '3 Direct Members', color: [59, 130, 246] as [number, number, number] },
    { lvl: 'Level 5', pct: '1.0%', perHelp: 'Rs. 1.50', teamReq: '4 Direct Members', color: [168, 85, 247] as [number, number, number] },
    { lvl: 'Level 6', pct: '0.5%', perHelp: 'Rs. 0.75', teamReq: '5 Direct Members', color: [236, 72, 153] as [number, number, number] },
  ];

  const tblX = 14;
  const tblY = 48;
  const tblW = 269;
  const rowH = 17;

  // Header Row
  doc.setFillColor(30, 41, 59);
  doc.rect(tblX, tblY, tblW, 10, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.rect(tblX, tblY, tblW, 10, 'S');

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('LEVEL HIERARCHY', tblX + 8, tblY + 7);
  doc.text('REWARD PERCENTAGE', tblX + 80, tblY + 7);
  doc.text('BONUS PER Rs. 150 HELP', tblX + 150, tblY + 7);
  doc.text('QUALIFYING DIRECTS', tblX + 215, tblY + 7);

  levels.forEach((l, i) => {
    const ry = tblY + 10 + i * rowH;
    doc.setFillColor(i % 2 === 0 ? 15 : 20, i % 2 === 0 ? 23 : 28, i % 2 === 0 ? 42 : 48);
    doc.rect(tblX, ry, tblW, rowH, 'F');
    doc.setDrawColor(51, 65, 85);
    doc.rect(tblX, ry, tblW, rowH, 'S');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(l.lvl, tblX + 8, ry + 11);

    doc.setTextColor(l.color[0], l.color[1], l.color[2]);
    doc.text(l.pct, tblX + 80, ry + 11);

    doc.setTextColor(52, 211, 153);
    doc.text(l.perHelp, tblX + 150, ry + 11);

    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(l.teamReq, tblX + 215, ry + 11);
  });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text('* Percentages represent stated community structure and are credited to the active balance wallet upon verified peer helps.', width / 2, 172, { align: 'center' });

  // ==========================================
  // SLIDE 6: REFERRAL EARNING POTENTIAL (3x3 MATRIX)
  // ==========================================
  doc.addPage();
  drawBackground(6);

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('TEAM DUPLICATION POWER (SAMPLE PROJECTION)', 14, 32);

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Illustrative 3-Member Duplication Matrix Across 6 Levels', 14, 38);

  const matrixRows = [
    { lvl: 'Level 1', formula: '3 Members x Rs. 7.50', total: 'Rs. 22.50' },
    { lvl: 'Level 2', formula: '9 Members x Rs. 6.00', total: 'Rs. 54.00' },
    { lvl: 'Level 3', formula: '27 Members x Rs. 4.50', total: 'Rs. 121.50' },
    { lvl: 'Level 4', formula: '81 Members x Rs. 3.00', total: 'Rs. 243.00' },
    { lvl: 'Level 5', formula: '243 Members x Rs. 1.50', total: 'Rs. 364.50' },
    { lvl: 'Level 6', formula: '729 Members x Rs. 0.75', total: 'Rs. 546.75' },
  ];

  drawCard(14, 48, 130, 126, '3-DIRECT MATRIX DUPLICATION TABLE', [59, 130, 246]);
  let mY = 62;
  matrixRows.forEach((r) => {
    doc.setTextColor(255, 215, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(r.lvl, 20, mY);

    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'normal');
    doc.text(r.formula, 45, mY);

    doc.setTextColor(52, 211, 153);
    doc.setFont('helvetica', 'bold');
    doc.text(r.total, 115, mY, { align: 'right' });
    mY += 16;
  });

  // Right summary callout
  drawCard(152, 48, 130, 126, 'KEY HIGHLIGHTS OF TEAM REWARDS', [16, 185, 129]);
  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const highlights = [
    '• Rewards are credited instantly on verified transaction.',
    '• Unlimited width: You can sponsor 3, 5, 10 or 100 directs.',
    '• No leg balancing required: Earning flows from active lines.',
    '• Minimal withdrawal threshold: Just Rs. 200.',
    '• Withdrawals processed in multiples of Rs. 200 (200, 400, 600...)',
    '• Bank account verification & KYC ensure genuine transfers.',
    '• Pure peer community model: Zero deduction on member aid.',
    '• Transparent ledger with unique transaction UTR tracking.',
  ];
  let hY = 64;
  highlights.forEach((h) => {
    doc.text(h, 158, hY);
    hY += 13.5;
  });

  // ==========================================
  // SLIDE 7: RULES & TRANSPARENCY
  // ==========================================
  doc.addPage();
  drawBackground(7);

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('RULES, TRANSPARENCY & COMMUNITY CODE OF ETHICS', 14, 32);

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Strict Principles Governing the HELP150 Platform', 14, 38);

  const ruleCards = [
    { title: '1. Read Complete Terms', desc: 'Review all terms of service and program operational rules before participating. Participation is strictly voluntary.', color: [212, 175, 55] as [number, number, number] },
    { title: '2. 100% Voluntary Help', desc: 'All contributions represent mutual voluntary peer support. Do not borrow funds or participate with money you cannot afford.', color: [59, 130, 246] as [number, number, number] },
    { title: '3. No Guaranteed Income', desc: 'HELP150 strictly does NOT promise or guarantee daily returns, fixed ROI, or passive investment yields.', color: [239, 68, 68] as [number, number, number] },
    { title: '4. 24-Hour Timeout Rule', desc: 'Members who fail to pay assigned verification links within 24 hours are blocked and auto-deleted to protect peers.', color: [245, 158, 11] as [number, number, number] },
    { title: '5. Never Share Secrets', desc: 'Never share passwords, bank OTPs, or verification secrets with anyone. Admin will never request your PIN or OTP.', color: [168, 85, 247] as [number, number, number] },
    { title: '6. KYC Compliance', desc: 'Aadhaar / PAN verification is mandatory before requesting bank withdrawal payouts to prevent duplicate accounts.', color: [16, 185, 129] as [number, number, number] },
  ];

  ruleCards.forEach((rc, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const rx = 14 + col * 91;
    const ry = 48 + row * 62;

    drawCard(rx, ry, 85, 54, rc.title, rc.color);
    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const splitDesc = doc.splitTextToSize(rc.desc, 77);
    doc.text(splitDesc, rx + 4, ry + 16);
  });

  // ==========================================
  // SLIDE 8: OFFICIAL CONTACT & COMMUNITY HELPLINE
  // ==========================================
  doc.addPage();
  drawBackground(8);

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('HELP 150 — OFFICIAL COORDINATES & SUPPORT', 14, 32);

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Connect with the Official Administration & Community Leaders', 14, 38);

  drawCard(30, 48, 237, 120, 'OFFICIAL COMMUNITY DETAILS', [212, 175, 55]);

  const contactList = [
    { label: 'Official Website:', val: 'https://help150.org  (or help150.vercel.app)' },
    { label: 'Official Email:', val: 'support@help150.org  (or help150@outlook.com)' },
    { label: 'Official Helpline / WhatsApp:', val: '+91 70664 63676' },
    { label: 'Central Treasury / Admin UPI:', val: '7066463676@naviaxis' },
    { label: 'Official Telegram Channel:', val: 'https://t.me/help150_official' },
    { label: 'Community Slogan:', val: '“Together For A Better Tomorrow”' },
  ];

  let cY = 66;
  contactList.forEach((c) => {
    doc.setTextColor(255, 215, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(c.label, 40, cY);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(c.val, 110, cY);

    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.2);
    doc.line(40, cY + 4, 250, cY + 4);
    cY += 16;
  });

  // ==========================================
  // SLIDE 9: THANK YOU & JOINING SUCCESS
  // ==========================================
  doc.addPage();
  drawBackground(9);

  // Radiant thank you badge
  doc.setFillColor(245, 158, 11);
  doc.circle(width / 2, 60, 24, 'F');
  doc.setFillColor(15, 23, 42);
  doc.circle(width / 2, 60, 20, 'F');
  doc.setTextColor(52, 211, 153);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('OK', width / 2, 67, { align: 'center' });

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('THANK YOU!', width / 2, 98, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('Rs. 150 JOINING SUCCESS!', width / 2, 108, { align: 'center' });

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Welcome to the HELP150 Community Mutual Assistance Movement.', width / 2, 118, { align: 'center' });
  doc.text('Register now, build your 6-level team, and experience transparent helping.', width / 2, 126, { align: 'center' });

  // Big Start CTA Box
  drawCard(68, 138, 160, 26, undefined, [245, 158, 11]);
  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('VISIT: www.help150.org  •  START TODAY', width / 2, 154, { align: 'center' });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text('Presentation for official education and transparent community participation. ... Terms Apply ...', width / 2, 178, { align: 'center' });

  // Trigger download in browser
  doc.save('HELP150_Official_Business_Plan.pdf');
}
