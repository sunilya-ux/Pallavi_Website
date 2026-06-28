import { useState, useEffect } from 'react';
import { LogOut, Menu, X, Users, Shield, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import ClientsManager from './ClientsManager';
import PermissionsManager from './PermissionsManager';
import PassionCoachingForm from './PassionCoachingForm';
import ChannelTrailerScriptGenerator from './ChannelTrailerScriptGenerator';
import YouTubeScriptGenerator from './YouTubeScriptGenerator';
import YouTubeChannelDescriptionGenerator from './YouTubeChannelDescriptionGenerator';
import VisionBoardGenerator from './VisionBoardGenerator';
import SmartGoalGenerator from './SmartGoalGenerator';
import GoalCreator from './GoalCreator';
import PassionRoadmapCreator from './PassionRoadmapCreator';
import RoadmapCreator from './RoadmapCreator';
import BigMoneyContentGenerator from './BigMoneyContentGenerator';
import WebinarBuilder from './WebinarBuilder';
import HookBuilder from './HookBuilder';
import type { ModuleWithTools } from '../types/permissions';

interface DashboardProps {
  userEmail: string;
}

interface Course {
  id: string;
  module_id: string;
  name: string;
  display_name: string;
  icon: string;
  sort_order: number;
}

export default function Dashboard({ userEmail }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'clients' | 'contract-generator'>('overview');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [modules, setModules] = useState<ModuleWithTools[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [activeToolRoute, setActiveToolRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Contract generator state
  const [contractClientName, setContractClientName] = useState('');
  const [contractGuarantee, setContractGuarantee] = useState(true);
  const [contractPaymentTerms, setContractPaymentTerms] = useState('');
  const [contractGenerated, setContractGenerated] = useState(false);

  useEffect(() => {
    loadModulesAndTools();
  }, []);

  const loadModulesAndTools = async () => {
    try {
      setLoading(true);

      const [modulesRes, toolsRes, coursesRes] = await Promise.all([
        supabase.from('modules').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('tools').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('courses').select('*').eq('is_active', true).order('sort_order')
      ]);

      if (modulesRes.error) throw modulesRes.error;
      if (toolsRes.error) throw toolsRes.error;
      if (coursesRes.error) throw coursesRes.error;

      const modulesWithTools: ModuleWithTools[] = (modulesRes.data || []).map(module => ({
        ...module,
        tools: (toolsRes.data || []).filter(tool => tool.module_id === module.id)
      }));

      setModules(modulesWithTools);
      setCourses(coursesRes.data || []);
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userType');
    window.location.reload();
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const isCoursesModule = (module: ModuleWithTools) => module.name === 'courses';

  const getLessonsForCourse = (course: Course, tools: ModuleWithTools['tools']) => {
    return tools.filter(tool => tool.route.startsWith('courses/'));
  };

  const handleToolClick = (route: string) => {
    setActiveToolRoute(route);
    setActiveSection('overview');
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? IconComponent : Icons.FileQuestion;
  };

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const GUARANTEE_TEXT_CHECKED = `Our coaching program is 6 months long, however, if you are not at your GOAL within 6 months in the program. We will help and support you UNTIL you make back the program fee paid to us.

You are eligible to claim any of the above guarantee if you satisfy the conditions below (according to our standards):

No Loss Guarantee: Work with us until you make back your investment! The guarantee applies only if you consistently complete the required work throughout the entire duration of the program.

We do not offer any refunds for the program under any circumstances. All payments made are non-refundable.`;

  const GUARANTEE_TEXT_UNCHECKED = `No guarantee is offered with this program. All payments made are non-refundable.`;

  const buildContractText = () => {
    const guaranteeText = contractGuarantee ? GUARANTEE_TEXT_CHECKED : GUARANTEE_TEXT_UNCHECKED;
    const name = contractClientName || '[CLIENT_NAME]';
    return `ELITE WIZARDS TRAINING AGREEMENT

Pallavi Chatterjee
Elite Wizards Training, Noida, India
++916386355905
info@lifecoachpallavichatterjee.com

ELITE WIZARDS TRAINING AGREEMENT [the "Agreement"] dated this ${today}.

Between

Pallavi Chatterjee and Elite Wizards Training, Noida India [The Contractor] &

${name} ["The Client"]

1. TERMS OF ENROLLMENT:
a. The following policy governs your participation in the Program Elite Wizards Training presented by Pallavi Chatterjee ["Contractor"]. Please read this Policy carefully. By using the Program you agree that your participation in our Program and use of Program materials is governed by the following terms and conditions.
b. We are committed to providing all participants with a positive experience. Thus, Pallavi Chatterjee may, at its sole discretion, limit, suspend, or terminate your participation in any of its programs, live, recorded, social media-based or digital without refund or forgiveness of remaining payments if:
c. You become disruptive or difficult to work with; you fail to follow the Program guidelines; or, you impair the participation of instructors or participants in the program.

2. PROGRAM DELIVERABLES (Admissible only to the Client):
a. Private Whatsapp Community
b. Coaching Program Content for 6 months
c. Accountability Support for 6 months
d. Support From Pallavi Chatterjee & other coaches for 6 months

3. CONTENT
a. Program education and information is intended for a general audience and does not purport to be, nor should it be construed as, specific advice, tailored to any individual.
b. All materials, procedures, policies, and standards, all teaching manuals, all teaching aids, all supplements and the like that have been or will be made available by Pallavi Chatterjee or its designated facilitators, or any other source, oral or written, are for personal use in or in conjunction with this training program only.
c. Program content is for personal use only, and cannot be sold, recorded, videotaped, shared, taught, given away, or otherwise divulged without the express written consent of Pallavi Chatterjee.
d. The information contained in the program material is strictly for educational purposes. Therefore, if you wish to apply ideas contained in this material, you are taking full responsibility for those actions.
e. We assume no responsibility for errors or omissions that may appear in any program materials.
f. Usernames and passwords cannot be shared with any third-parties.
g. Any violation of Pallavi Chatterjee's policies regarding content usage shall result in the immediate termination of your enrollment without refund.

4. PRIVACY AND CONFIDENTIALITY
a. We respect your privacy and must insist that you respect the privacy of fellow Elite Wizards Training participants.
b. We respect your confidential and proprietary information ideas, plans and trade secrets [collectively, "Confidential Information"] and must insist that you respect the same rights of fellow Program participants and of Pallavi Chatterjee.
c. Thus, you agree:
- Not to infringe any Program participants or Pallavi Chatterjee's copyright, patent, trademark, trade secret or other intellectual property rights;
- Any Confidential Information shared by program participants or any representative of Pallavi Chatterjee is confidential and Proprietary, and belongs solely and exclusively to the Participant who discloses it or Pallavi Chatterjee. Such information cannot be disclosed to any other person or used in any manner other than in discussion with other Program participants during Program sessions;
- All materials and information provided to you by Pallavi Chatterjee is confidential and its proprietary intellectual property belongs solely and exclusively to Pallavi Chatterjee, and can only be used by you as authorized by Pallavi Chatterjee;
- The reproduction, distribution and sale of these materials by anyone but Pallavi Chatterjee is strictly prohibited;
d. While you are free to discuss your personal results from programs and training, you must keep the experiences and statements, oral or written, of all other participants in the strictest of confidence.

5. INTERACTIVE FEATURES
a. It is a condition of your use of the Private Student Group and participation in the Program that you do not:
- Restrict or inhibit any other user from using and enjoying the deliverables.
- Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.
- Instigate or encourage others to commit illegal activities or cause injury or property damage to any person.
- Gain unauthorized access to the services, or any account, computer system, or network connected, by means such as hacking, password mining or other illicit means.
- Post or transmit any unlawful, threatening, abusive, libelous, defamatory, obscene, vulgar, pornographic, profane or indecent information of any kind.
- Post or transmit any information, software or other material that violates or infringes upon the rights of others.
- Post, transmit or in any way exploit any information, software or other material for commercial purposes without our express written approval.
- Gather for marketing purposes any email addresses or other personal information posted by other users.

6. LIMITATION OF LIABILITY
a. Any user failing to comply with the terms and conditions of this Agreement may be expelled from and refused continued access to the Program. Pallavi Chatterjee expressly disclaims all responsibility and endorsement and makes no representation as to the validity of any opinion, advice, information or statement made or displayed in these forums by third parties. Under no circumstances will we, our affiliates, suppliers or agents be liable for any loss or damage caused by your reliance on information obtained through these forums.
b. Pallavi Chatterjee has no obligation whatsoever to monitor any of the content or postings on the message boards, chat rooms or other public forums of the Program.
c. Under no circumstances shall we, our subsidiary and parent companies or affiliates be liable for any direct, indirect, incidental, special or consequential damages that result from the use of, or the inability to use, the program materials. If you are dissatisfied with the Program, your sole and exclusive remedy is to discontinue using the products, services and/or materials.

7. GUARANTEE OFFERED
${guaranteeText}

8. NON-DISCLOSURE AND NON-USE OBLIGATIONS
a. You agree to maintain, in confidence and will not disclose, disseminate or use any Confidential Information belonging to Pallavi Chatterjee, whether or not in written form.
b. Definition of Confidentiality. As used in this Agreement, "Confidential Information" refers to the business activities, dealings or interests of Pallavi Chatterjee and/or its officers, directors, affiliates, and/or employees; any confidential information, knowledge and know-how concerning the operations, products, services, procedures, or clients of Pallavi Chatterjee.

9. MEDIA AND MARKETING RELEASE
a. I authorize Pallavi Chatterjee and all its subsidiaries and trademark brands to use my materials for marketing purposes. These materials include but are not limited to using my name, voice, picture, video, screenshots of messages, any information obtained during live events, online training calls, without payment or any other form of compensation to me.
b. Agree that I shall not have any right of approval, claim to additional compensation or benefit, or claim arising out of the use of my name and/or photograph/video.
c. Agree that any and all materials created by Pallavi Chatterjee that incorporate my name and/or photograph/likeness shall remain the sole and exclusive property of Pallavi Chatterjee.

10. DISPUTE RESOLUTION
a. All disputes arising under or concerning this Agreement are to be submitted to Alternative Dispute Resolution Based at Noida or Delhi, India.

11. PAYMENT TERMS
${contractPaymentTerms || '[PAYMENT_TERMS]'}

12. TERMINATION BY ${name}:
If ${name} terminates this agreement for any reason other than a breach of contract by Elite Wizards Training, ${name} shall be obligated to pay Elite Wizards Training the remaining balance of all fees and expenses due under this agreement as of the date of termination.

Enforcement: In the event ${name} fails to make the required payment as stipulated in this clause, Elite Wizards Training shall be entitled to pursue all available legal remedies to enforce payment, including but not limited to, seeking damages, injunctive relief, and legal fees incurred in the collection process.

13. SEVERABILITY CLAUSE:
If any provision of this Agreement is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the validity, legality, and enforceability of the remaining provisions shall not in any way be affected or impaired thereby.

IN WITNESS WHEREOF Pallavi Chatterjee have duly affixed their signatures under hand and seal on ${today}.

                                                    ____________________
                                                    Signatures of the client

Signature of Pallavi Chatterjee`;
  };

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const generateContractHTML = () => {
    const name = esc(contractClientName || '[CLIENT_NAME]');
    const paymentTerms = esc(contractPaymentTerms || '[PAYMENT_TERMS]');

    const sectionItems = (lines: string[]) =>
      lines.map(l => `<p class="section-body">${esc(l)}</p>`).join('');

    const guaranteeBlock = contractGuarantee
      ? `<div class="guarantee-box">
          <div class="guarantee-title">&#10003; Guarantee Included</div>
          <p>Our coaching program is 6 months long, however, if you are not at your GOAL within 6 months in the program. We will help and support you UNTIL you make back the program fee paid to us.</p>
          <p style="margin-top:8px;">You are eligible to claim any of the above guarantee if you satisfy the conditions below (according to our standards):</p>
          <p style="margin-top:8px;"><strong>No Loss Guarantee:</strong> Work with us until you make back your investment! The guarantee applies only if you consistently complete the required work throughout the entire duration of the program.</p>
          <p style="margin-top:8px;">We do not offer any refunds for the program under any circumstances. All payments made are non-refundable.</p>
        </div>`
      : `<div class="guarantee-box" style="background:#fff8f8;border-color:#c00;">
          <div class="guarantee-title" style="color:#c00;">No Guarantee Offered</div>
          <p>No guarantee is offered with this program. All payments made are non-refundable.</p>
        </div>`;

    return `<div class="contract-wrapper">
  <div class="contract-header">
    <div class="company-name">Elite Wizards Training</div>
    <div class="contact-info">Pallavi Chatterjee &nbsp;|&nbsp; Noida, India &nbsp;|&nbsp; ++916386355905 &nbsp;|&nbsp; info@lifecoachpallavichatterjee.com</div>
  </div>

  <div class="contract-title">Elite Wizards Training Agreement</div>

  <div class="contract-meta">
    <span class="agreement-date">Agreement dated: ${esc(today)}</span>
  </div>

  <div class="parties-block">
    <span class="party-label">Contractor:</span> Pallavi Chatterjee &amp; Elite Wizards Training, Noida India<br/>
    <span class="party-label">Client:</span> ${name}
  </div>

  <div class="section-heading">1. Terms of Enrollment</div>
  ${sectionItems([
    'a. The following policy governs your participation in the Program Elite Wizards Training presented by Pallavi Chatterjee ["Contractor"]. Please read this Policy carefully. By using the Program you agree that your participation in our Program and use of Program materials is governed by the following terms and conditions.',
    'b. We are committed to providing all participants with a positive experience. Thus, Pallavi Chatterjee may, at its sole discretion, limit, suspend, or terminate your participation in any of its programs, live, recorded, social media-based or digital without refund or forgiveness of remaining payments if:',
    'c. You become disruptive or difficult to work with; you fail to follow the Program guidelines; or, you impair the participation of instructors or participants in the program.',
  ])}

  <div class="section-heading">2. Program Deliverables (Admissible only to the Client)</div>
  ${sectionItems([
    'a. Private Whatsapp Community',
    'b. Coaching Program Content for 6 months',
    'c. Accountability Support for 6 months',
    'd. Support From Pallavi Chatterjee & other coaches for 6 months',
  ])}

  <div class="section-heading">3. Content</div>
  ${sectionItems([
    'a. Program education and information is intended for a general audience and does not purport to be, nor should it be construed as, specific advice, tailored to any individual.',
    'b. All materials, procedures, policies, and standards, all teaching manuals, all teaching aids, all supplements and the like that have been or will be made available by Pallavi Chatterjee or its designated facilitators, or any other source, oral or written, are for personal use in or in conjunction with this training program only.',
    'c. Program content is for personal use only, and cannot be sold, recorded, videotaped, shared, taught, given away, or otherwise divulged without the express written consent of Pallavi Chatterjee.',
    'd. The information contained in the program material is strictly for educational purposes. Therefore, if you wish to apply ideas contained in this material, you are taking full responsibility for those actions.',
    'e. We assume no responsibility for errors or omissions that may appear in any program materials.',
    'f. Usernames and passwords cannot be shared with any third-parties.',
    'g. Any violation of Pallavi Chatterjee\'s policies regarding content usage shall result in the immediate termination of your enrollment without refund.',
  ])}

  <div class="section-heading">4. Privacy and Confidentiality</div>
  ${sectionItems([
    'a. We respect your privacy and must insist that you respect the privacy of fellow Elite Wizards Training participants.',
    'b. We respect your confidential and proprietary information ideas, plans and trade secrets [collectively, "Confidential Information"] and must insist that you respect the same rights of fellow Program participants and of Pallavi Chatterjee.',
    'c. Thus, you agree:',
  ])}
  <ul class="bullet-list">
    <li>Not to infringe any Program participants or Pallavi Chatterjee\'s copyright, patent, trademark, trade secret or other intellectual property rights;</li>
    <li>Any Confidential Information shared by program participants or any representative of Pallavi Chatterjee is confidential and Proprietary, and belongs solely and exclusively to the Participant who discloses it or Pallavi Chatterjee. Such information cannot be disclosed to any other person or used in any manner other than in discussion with other Program participants during Program sessions;</li>
    <li>All materials and information provided to you by Pallavi Chatterjee is confidential and its proprietary intellectual property belongs solely and exclusively to Pallavi Chatterjee, and can only be used by you as authorized by Pallavi Chatterjee;</li>
    <li>The reproduction, distribution and sale of these materials by anyone but Pallavi Chatterjee is strictly prohibited;</li>
  </ul>
  <p class="section-body">d. While you are free to discuss your personal results from programs and training, you must keep the experiences and statements, oral or written, of all other participants in the strictest of confidence.</p>

  <div class="section-heading">5. Interactive Features</div>
  <p class="section-body">a. It is a condition of your use of the Private Student Group and participation in the Program that you do not:</p>
  <ul class="bullet-list">
    <li>Restrict or inhibit any other user from using and enjoying the deliverables.</li>
    <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
    <li>Instigate or encourage others to commit illegal activities or cause injury or property damage to any person.</li>
    <li>Gain unauthorized access to the services, or any account, computer system, or network connected, by means such as hacking, password mining or other illicit means.</li>
    <li>Post or transmit any unlawful, threatening, abusive, libelous, defamatory, obscene, vulgar, pornographic, profane or indecent information of any kind.</li>
    <li>Post or transmit any information, software or other material that violates or infringes upon the rights of others.</li>
    <li>Post, transmit or in any way exploit any information, software or other material for commercial purposes without our express written approval.</li>
    <li>Gather for marketing purposes any email addresses or other personal information posted by other users.</li>
  </ul>

  <div class="section-heading">6. Limitation of Liability</div>
  ${sectionItems([
    'a. Any user failing to comply with the terms and conditions of this Agreement may be expelled from and refused continued access to the Program. Pallavi Chatterjee expressly disclaims all responsibility and endorsement and makes no representation as to the validity of any opinion, advice, information or statement made or displayed in these forums by third parties. Under no circumstances will we, our affiliates, suppliers or agents be liable for any loss or damage caused by your reliance on information obtained through these forums.',
    'b. Pallavi Chatterjee has no obligation whatsoever to monitor any of the content or postings on the message boards, chat rooms or other public forums of the Program.',
    'c. Under no circumstances shall we, our subsidiary and parent companies or affiliates be liable for any direct, indirect, incidental, special or consequential damages that result from the use of, or the inability to use, the program materials. If you are dissatisfied with the Program, your sole and exclusive remedy is to discontinue using the products, services and/or materials.',
  ])}

  <div class="section-heading">7. Guarantee Offered</div>
  ${guaranteeBlock}

  <div class="section-heading">8. Non-Disclosure and Non-Use Obligations</div>
  ${sectionItems([
    'a. You agree to maintain, in confidence and will not disclose, disseminate or use any Confidential Information belonging to Pallavi Chatterjee, whether or not in written form.',
    'b. Definition of Confidentiality. As used in this Agreement, "Confidential Information" refers to the business activities, dealings or interests of Pallavi Chatterjee and/or its officers, directors, affiliates, and/or employees; any confidential information, knowledge and know-how concerning the operations, products, services, procedures, or clients of Pallavi Chatterjee.',
  ])}

  <div class="section-heading">9. Media and Marketing Release</div>
  ${sectionItems([
    'a. I authorize Pallavi Chatterjee and all its subsidiaries and trademark brands to use my materials for marketing purposes. These materials include but are not limited to using my name, voice, picture, video, screenshots of messages, any information obtained during live events, online training calls, without payment or any other form of compensation to me.',
    'b. Agree that I shall not have any right of approval, claim to additional compensation or benefit, or claim arising out of the use of my name and/or photograph/video.',
    'c. Agree that any and all materials created by Pallavi Chatterjee that incorporate my name and/or photograph/likeness shall remain the sole and exclusive property of Pallavi Chatterjee.',
  ])}

  <div class="section-heading">10. Dispute Resolution</div>
  <p class="section-body">a. All disputes arising under or concerning this Agreement are to be submitted to Alternative Dispute Resolution Based at Noida or Delhi, India.</p>

  <div class="section-heading">11. Payment Terms</div>
  <div class="payment-box">${paymentTerms}</div>

  <div class="section-heading">12. Termination by ${name}</div>
  <p class="section-body">If ${name} terminates this agreement for any reason other than a breach of contract by Elite Wizards Training, ${name} shall be obligated to pay Elite Wizards Training the remaining balance of all fees and expenses due under this agreement as of the date of termination.</p>
  <p class="section-body"><strong>Enforcement:</strong> In the event ${name} fails to make the required payment as stipulated in this clause, Elite Wizards Training shall be entitled to pursue all available legal remedies to enforce payment, including but not limited to, seeking damages, injunctive relief, and legal fees incurred in the collection process.</p>

  <div class="section-heading">13. Severability Clause</div>
  <p class="section-body">If any provision of this Agreement is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the validity, legality, and enforceability of the remaining provisions shall not in any way be affected or impaired thereby.</p>

  <p class="section-body" style="margin-top:20px;">IN WITNESS WHEREOF Pallavi Chatterjee have duly affixed their signatures under hand and seal on ${esc(today)}.</p>

  <div class="signature-section">
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-label">Signature of Pallavi Chatterjee</div>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-label">Signature of ${name} (The Client)</div>
    </div>
  </div>
</div>`;
  };

  const PRINT_STYLES = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 2cm 2.5cm; }
    @page :first { margin-top: 2.5cm; }
    body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 11pt; line-height: 1.7; color: #1a1a1a; background: #fff; }
    .contract-wrapper { max-width: 100%; }
    .contract-header { border-bottom: 3px solid #1a5c3a; padding-bottom: 16px; margin-bottom: 24px; }
    .contract-header .company-name { font-size: 18pt; font-weight: 700; color: #1a5c3a; letter-spacing: 1px; text-transform: uppercase; }
    .contract-header .contact-info { font-size: 9pt; color: #555; margin-top: 4px; line-height: 1.5; }
    .contract-title { text-align: center; font-size: 15pt; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a; margin: 24px 0 8px 0; padding: 12px 0; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; }
    .contract-meta { margin: 20px 0; font-size: 10.5pt; color: #333; }
    .contract-meta .agreement-date { font-weight: 600; }
    .parties-block { background: #f7faf8; border-left: 4px solid #1a5c3a; padding: 12px 16px; margin: 16px 0 24px 0; font-size: 10.5pt; }
    .parties-block .party-label { font-weight: 700; color: #1a5c3a; }
    .section-heading { font-size: 11pt; font-weight: 700; text-transform: uppercase; color: #1a1a1a; margin-top: 22px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #ddd; letter-spacing: 0.5px; }
    .section-body { font-size: 10.5pt; color: #2a2a2a; margin-bottom: 6px; }
    .section-body p { margin-bottom: 6px; }
    .bullet-list { margin: 6px 0 6px 16px; }
    .bullet-list li { margin-bottom: 4px; font-size: 10.5pt; list-style-type: disc; }
    .guarantee-box { background: #f0faf4; border: 1px solid #1a5c3a; border-radius: 4px; padding: 12px 16px; margin-top: 8px; font-size: 10.5pt; }
    .guarantee-box .guarantee-title { font-weight: 700; color: #1a5c3a; margin-bottom: 6px; }
    .payment-box { background: #fafafa; border: 1px solid #ccc; border-radius: 4px; padding: 12px 16px; margin-top: 8px; font-size: 10.5pt; white-space: pre-wrap; }
    .signature-section { margin-top: 48px; padding-top: 20px; border-top: 2px solid #1a5c3a; display: flex; justify-content: space-between; gap: 40px; }
    .signature-block { flex: 1; }
    .signature-line { border-bottom: 1px solid #333; height: 40px; margin-bottom: 6px; }
    .signature-label { font-size: 9pt; color: #555; font-weight: 600; }
    .page-break { page-break-before: always; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } button { display: none !important; } }
  `;

  const getContractSections = (name: string, date: string, paymentTerms: string, guaranteeEnabled: boolean) => {
    const guaranteeBodyLines = guaranteeEnabled
      ? [
          'Our coaching program is 6 months long, however, if you are not at your GOAL within 6 months in the program. We will help and support you UNTIL you make back the program fee paid to us.',
          'You are eligible to claim any of the above guarantee if you satisfy the conditions below (according to our standards):',
          'No Loss Guarantee: Work with us until you make back your investment! The guarantee applies only if you consistently complete the required work throughout the entire duration of the program.',
          'We do not offer any refunds for the program under any circumstances. All payments made are non-refundable.',
        ]
      : ['No guarantee is offered with this program. All payments made are non-refundable.'];

    return [
      {
        heading: '1. TERMS OF ENROLLMENT',
        bodyLines: [
          'a. The following policy governs your participation in the Program Elite Wizards Training presented by Pallavi Chatterjee ["Contractor"]. Please read this Policy carefully. By using the Program you agree that your participation in our Program and use of Program materials is governed by the following terms and conditions.',
          'b. We are committed to providing all participants with a positive experience. Thus, Pallavi Chatterjee may, at its sole discretion, limit, suspend, or terminate your participation in any of its programs, live, recorded, social media-based or digital without refund or forgiveness of remaining payments if:',
          'c. You become disruptive or difficult to work with; you fail to follow the Program guidelines; or, you impair the participation of instructors or participants in the program.',
        ],
      },
      {
        heading: '2. PROGRAM DELIVERABLES (Admissible only to the Client)',
        bodyLines: [
          'a. Private Whatsapp Community',
          'b. Coaching Program Content for 6 months',
          'c. Accountability Support for 6 months',
          'd. Support From Pallavi Chatterjee & other coaches for 6 months',
        ],
      },
      {
        heading: '3. CONTENT',
        bodyLines: [
          'a. Program education and information is intended for a general audience and does not purport to be, nor should it be construed as, specific advice, tailored to any individual.',
          'b. All materials, procedures, policies, and standards, all teaching manuals, all teaching aids, all supplements and the like that have been or will be made available by Pallavi Chatterjee or its designated facilitators, or any other source, oral or written, are for personal use in or in conjunction with this training program only.',
          'c. Program content is for personal use only, and cannot be sold, recorded, videotaped, shared, taught, given away, or otherwise divulged without the express written consent of Pallavi Chatterjee.',
          'd. The information contained in the program material is strictly for educational purposes. Therefore, if you wish to apply ideas contained in this material, you are taking full responsibility for those actions.',
          'e. We assume no responsibility for errors or omissions that may appear in any program materials.',
          'f. Usernames and passwords cannot be shared with any third-parties.',
          "g. Any violation of Pallavi Chatterjee's policies regarding content usage shall result in the immediate termination of your enrollment without refund.",
        ],
      },
      {
        heading: '4. PRIVACY AND CONFIDENTIALITY',
        bodyLines: [
          'a. We respect your privacy and must insist that you respect the privacy of fellow Elite Wizards Training participants.',
          'b. We respect your confidential and proprietary information ideas, plans and trade secrets [collectively, "Confidential Information"] and must insist that you respect the same rights of fellow Program participants and of Pallavi Chatterjee.',
          'c. Thus, you agree:',
          "- Not to infringe any Program participants or Pallavi Chatterjee's copyright, patent, trademark, trade secret or other intellectual property rights;",
          '- Any Confidential Information shared by program participants or any representative of Pallavi Chatterjee is confidential and Proprietary, and belongs solely and exclusively to the Participant who discloses it or Pallavi Chatterjee. Such information cannot be disclosed to any other person or used in any manner other than in discussion with other Program participants during Program sessions;',
          '- All materials and information provided to you by Pallavi Chatterjee is confidential and its proprietary intellectual property belongs solely and exclusively to Pallavi Chatterjee, and can only be used by you as authorized by Pallavi Chatterjee;',
          '- The reproduction, distribution and sale of these materials by anyone but Pallavi Chatterjee is strictly prohibited;',
          'd. While you are free to discuss your personal results from programs and training, you must keep the experiences and statements, oral or written, of all other participants in the strictest of confidence.',
        ],
      },
      {
        heading: '5. INTERACTIVE FEATURES',
        bodyLines: [
          'a. It is a condition of your use of the Private Student Group and participation in the Program that you do not:',
          '- Restrict or inhibit any other user from using and enjoying the deliverables.',
          '- Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.',
          '- Instigate or encourage others to commit illegal activities or cause injury or property damage to any person.',
          '- Gain unauthorized access to the services, or any account, computer system, or network connected, by means such as hacking, password mining or other illicit means.',
          '- Post or transmit any unlawful, threatening, abusive, libelous, defamatory, obscene, vulgar, pornographic, profane or indecent information of any kind.',
          '- Post or transmit any information, software or other material that violates or infringes upon the rights of others.',
          '- Post, transmit or in any way exploit any information, software or other material for commercial purposes without our express written approval.',
          '- Gather for marketing purposes any email addresses or other personal information posted by other users.',
        ],
      },
      {
        heading: '6. LIMITATION OF LIABILITY',
        bodyLines: [
          'a. Any user failing to comply with the terms and conditions of this Agreement may be expelled from and refused continued access to the Program. Pallavi Chatterjee expressly disclaims all responsibility and endorsement and makes no representation as to the validity of any opinion, advice, information or statement made or displayed in these forums by third parties. Under no circumstances will we, our affiliates, suppliers or agents be liable for any loss or damage caused by your reliance on information obtained through these forums.',
          'b. Pallavi Chatterjee has no obligation whatsoever to monitor any of the content or postings on the message boards, chat rooms or other public forums of the Program.',
          'c. Under no circumstances shall we, our subsidiary and parent companies or affiliates be liable for any direct, indirect, incidental, special or consequential damages that result from the use of, or the inability to use, the program materials. If you are dissatisfied with the Program, your sole and exclusive remedy is to discontinue using the products, services and/or materials.',
        ],
      },
      {
        heading: guaranteeEnabled ? '7. GUARANTEE OFFERED' : '7. NO GUARANTEE OFFERED',
        bodyLines: guaranteeBodyLines,
      },
      {
        heading: '8. NON-DISCLOSURE AND NON-USE OBLIGATIONS',
        bodyLines: [
          'a. You agree to maintain, in confidence and will not disclose, disseminate or use any Confidential Information belonging to Pallavi Chatterjee, whether or not in written form.',
          'b. Definition of Confidentiality. As used in this Agreement, "Confidential Information" refers to the business activities, dealings or interests of Pallavi Chatterjee and/or its officers, directors, affiliates, and/or employees; any confidential information, knowledge and know-how concerning the operations, products, services, procedures, or clients of Pallavi Chatterjee.',
        ],
      },
      {
        heading: '9. MEDIA AND MARKETING RELEASE',
        bodyLines: [
          'a. I authorize Pallavi Chatterjee and all its subsidiaries and trademark brands to use my materials for marketing purposes. These materials include but are not limited to using my name, voice, picture, video, screenshots of messages, any information obtained during live events, online training calls, without payment or any other form of compensation to me.',
          'b. Agree that I shall not have any right of approval, claim to additional compensation or benefit, or claim arising out of the use of my name and/or photograph/video.',
          'c. Agree that any and all materials created by Pallavi Chatterjee that incorporate my name and/or photograph/likeness shall remain the sole and exclusive property of Pallavi Chatterjee.',
        ],
      },
      {
        heading: '10. DISPUTE RESOLUTION',
        bodyLines: [
          'a. All disputes arising under or concerning this Agreement are to be submitted to Alternative Dispute Resolution Based at Noida or Delhi, India.',
        ],
      },
      {
        heading: '11. PAYMENT TERMS',
        bodyLines: [paymentTerms],
      },
      {
        heading: `12. TERMINATION BY ${name.toUpperCase()}`,
        bodyLines: [
          `If ${name} terminates this agreement for any reason other than a breach of contract by Elite Wizards Training, ${name} shall be obligated to pay Elite Wizards Training the remaining balance of all fees and expenses due under this agreement as of the date of termination.`,
          `Enforcement: In the event ${name} fails to make the required payment as stipulated in this clause, Elite Wizards Training shall be entitled to pursue all available legal remedies to enforce payment, including but not limited to, seeking damages, injunctive relief, and legal fees incurred in the collection process.`,
        ],
      },
      {
        heading: '13. SEVERABILITY CLAUSE',
        bodyLines: [
          'If any provision of this Agreement is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the validity, legality, and enforceability of the remaining provisions shall not in any way be affected or impaired thereby.',
        ],
      },
    ];
  };

  const handleDownloadPDF = async () => {
    if (!(window as any).PDFLib) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load pdf-lib'));
        document.head.appendChild(script);
      });
    }

    const { PDFDocument, rgb, StandardFonts } = (window as any).PDFLib;

    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 60;
    const contentWidth = pageWidth - margin * 2;

    const green = rgb(0.1, 0.36, 0.23);
    const black = rgb(0.1, 0.1, 0.1);
    const grey = rgb(0.4, 0.4, 0.4);
    const lightGrey = rgb(0.85, 0.85, 0.85);

    const state: { page: ReturnType<typeof pdfDoc.addPage>; y: number } = {
      page: pdfDoc.addPage([pageWidth, pageHeight]),
      y: pageHeight - margin,
    };

    const checkPageBreak = (needed = 30) => {
      if (state.y < margin + needed) {
        state.page = pdfDoc.addPage([pageWidth, pageHeight]);
        state.y = pageHeight - margin;
      }
    };

    const addText = (text: string, fontSize: number, font: typeof timesRoman, color: ReturnType<typeof rgb>, indent = 0, lineHeightMult = 1.5) => {
      const maxWidth = contentWidth - indent;
      const words = text.split(' ');
      let line = '';
      for (const word of words) {
        const testLine = line ? line + ' ' + word : word;
        if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && line) {
          checkPageBreak(fontSize * lineHeightMult + 4);
          state.page.drawText(line, { x: margin + indent, y: state.y, size: fontSize, font, color });
          state.y -= fontSize * lineHeightMult;
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line) {
        checkPageBreak(fontSize * lineHeightMult + 4);
        state.page.drawText(line, { x: margin + indent, y: state.y, size: fontSize, font, color });
        state.y -= fontSize * lineHeightMult;
      }
    };

    const addSpace = (pts: number) => { state.y -= pts; };

    const addHRule = (color: ReturnType<typeof rgb> = green, thickness = 1.5) => {
      checkPageBreak(10);
      state.page.drawLine({ start: { x: margin, y: state.y }, end: { x: pageWidth - margin, y: state.y }, thickness, color });
      state.y -= 8;
    };

    const name = contractClientName || '[CLIENT_NAME]';
    const sections = getContractSections(name, today, contractPaymentTerms || '[PAYMENT_TERMS]', contractGuarantee);

    // HEADER
    addText('ELITE WIZARDS TRAINING', 16, timesRomanBold, green);
    addSpace(3);
    addText('Pallavi Chatterjee  |  Noida, India  |  ++916386355905  |  info@lifecoachpallavichatterjee.com', 8, timesRoman, grey);
    addSpace(6);
    addHRule(green, 2.5);
    addSpace(10);

    // TITLE
    addText('ELITE WIZARDS TRAINING AGREEMENT', 13, timesRomanBold, black);
    addSpace(4);
    addHRule(lightGrey, 0.8);
    addSpace(10);

    // DATE
    addText(`Agreement dated: ${today}`, 10.5, timesRomanBold, black);
    addSpace(10);

    // PARTIES BLOCK with green left bar
    checkPageBreak(50);
    state.page.drawLine({ start: { x: margin + 2, y: state.y + 12 }, end: { x: margin + 2, y: state.y - 30 }, thickness: 3, color: green });
    addText('Contractor: Pallavi Chatterjee & Elite Wizards Training, Noida India', 10, timesRoman, black, 12);
    addText(`Client: ${name}`, 10, timesRoman, black, 12);
    addSpace(16);

    // SECTIONS
    for (const section of sections) {
      checkPageBreak(40);
      addText(section.heading, 10.5, timesRomanBold, black);
      addSpace(1);
      addHRule(lightGrey, 0.5);
      addSpace(4);
      for (const line of section.bodyLines) {
        const indent = line.startsWith('-') ? 14 : 0;
        addText(line, 9.5, timesRoman, black, indent);
        addSpace(2);
      }
      addSpace(8);
    }

    // SIGNATURE
    checkPageBreak(100);
    addSpace(16);
    addHRule(green, 2);
    addSpace(36);

    const sigY = state.y;
    state.page.drawLine({ start: { x: margin, y: sigY }, end: { x: margin + 185, y: sigY }, thickness: 1, color: black });
    state.page.drawLine({ start: { x: pageWidth - margin - 185, y: sigY }, end: { x: pageWidth - margin, y: sigY }, thickness: 1, color: black });
    state.y -= 14;

    state.page.drawText('Signature of Pallavi Chatterjee', { x: margin, y: state.y, size: 8, font: timesRoman, color: grey });
    const clientLabel = `Signature of ${name} (The Client)`;
    const clientLabelWidth = timesRoman.widthOfTextAtSize(clientLabel, 8);
    state.page.drawText(clientLabel, { x: pageWidth - margin - Math.min(clientLabelWidth, 185), y: state.y, size: 8, font: timesRoman, color: grey });

    // SAVE & DOWNLOAD
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Elite_Wizards_Training_Agreement.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = () => {
    const contractHTML = generateContractHTML();
    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Elite Wizards Training Agreement</title>
        </head>
        <body style="font-family: Times New Roman; font-size: 12pt; padding: 40px;">
          ${contractHTML}
        </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', wordContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Elite_Wizards_Agreement_${(contractClientName || 'Client').replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderContractGenerator = () => {
    const contractHTML = contractGenerated ? generateContractHTML() : '';
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Contract Generator</h2>
              <p className="text-sm text-slate-500">Generate an Elite Wizards Training Agreement</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Agreement Date</label>
              <input
                type="text"
                value={today}
                readOnly
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-default"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={contractClientName}
                onChange={(e) => { setContractClientName(e.target.value); setContractGenerated(false); }}
                placeholder="Enter full client name"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm text-slate-900"
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="guarantee-checkbox"
                checked={contractGuarantee}
                onChange={(e) => { setContractGuarantee(e.target.checked); setContractGenerated(false); }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="guarantee-checkbox" className="text-sm text-slate-700 cursor-pointer leading-snug">
                <span className="font-medium">Include Guarantee Clause (Point 7):</span> Work with us until you make back your investment
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Terms (Point 11) <span className="text-red-500">*</span></label>
              <textarea
                value={contractPaymentTerms}
                onChange={(e) => { setContractPaymentTerms(e.target.value); setContractGenerated(false); }}
                placeholder="Enter payment details, installment amounts, due dates, accepted methods, etc."
                rows={5}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm text-slate-900 resize-vertical"
              />
            </div>

            <button
              onClick={() => {
                if (!contractClientName.trim()) {
                  alert('Please enter a client name before generating the contract.');
                  return;
                }
                setContractGenerated(true);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Generate Contract
            </button>
          </div>
        </div>

        {contractGenerated && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Contract Preview</h3>
            <div className="bg-white rounded-lg border border-slate-200 p-6 overflow-auto" style={{ fontFamily: 'Georgia, serif', fontSize: '11pt', lineHeight: '1.7', color: '#1a1a1a' }}>
              <style>{PRINT_STYLES}</style>
              <div dangerouslySetInnerHTML={{ __html: contractHTML }} />
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={handleDownloadWord}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Download Word Doc
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderToolContent = () => {
    if (activeSection === 'clients') {
      return <ClientsManager />;
    }

    if (activeSection === 'contract-generator') {
      return renderContractGenerator();
    }

    if (activeToolRoute === '/passion-coaching') {
      return <PassionCoachingForm clientId="admin" />;
    }

    if (activeToolRoute === '/tools/channel-trailer-script') {
      return <ChannelTrailerScriptGenerator />;
    }

    if (activeToolRoute === '/tools/youtube-script-generator') {
      return <YouTubeScriptGenerator />;
    }

    if (activeToolRoute === '/tools/youtube-channel-description') {
      return <YouTubeChannelDescriptionGenerator />;
    }

    if (activeToolRoute === '/tools/vision-board-generator') {
      return <VisionBoardGenerator />;
    }

    if (activeToolRoute === 'smart-goal-generator') {
      return <SmartGoalGenerator />;
    }

    if (activeToolRoute === 'goal-creator') {
      return <GoalCreator />;
    }

    if (activeToolRoute === 'passion-roadmap-creator') {
      return <PassionRoadmapCreator clientId="admin" />;
    }

    if (activeToolRoute === 'roadmap-creator') {
      return <RoadmapCreator clientId="admin" />;
    }

    if (activeToolRoute === 'big-money-content-generator') {
      return <BigMoneyContentGenerator clientId="admin" />;
    }

    if (activeToolRoute === '/tools/webinar-builder') {
      return <WebinarBuilder />;
    }

    if (activeToolRoute === '/tools/hook-builder') {
      return <HookBuilder />;
    }

    if (activeToolRoute?.startsWith('courses/')) {
      return <AdminCourseLessonView route={activeToolRoute} modules={modules} />;
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-3">
          Welcome to Admin Dashboard
        </h1>
        <p className="text-body text-slate-600 mb-8">
          Manage your coaching business, clients, and access all your tools from here.
        </p>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200">
            <h3 className="text-section-title text-slate-900 mb-3">Quick Actions</h3>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => setActiveSection('clients')}
                className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Manage Clients</p>
                  <p className="text-xs text-slate-600">Add and manage client accounts</p>
                </div>
              </button>

              <button
                onClick={() => setShowPermissionsModal(true)}
                className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Access Control</p>
                  <p className="text-xs text-slate-600">Manage tool permissions</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="text-section-title text-slate-900 mb-4">Available Tools</h3>
            <p className="text-body text-slate-600 mb-4">Select a tool from the sidebar to get started.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map(module => (
                <div key={module.id} className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const IconComponent = getIconComponent(module.icon);
                      return <IconComponent className="w-5 h-5 text-slate-600" />;
                    })()}
                    <h4 className="text-sm font-semibold text-slate-900">{module.display_name}</h4>
                  </div>
                  <p className="text-xs text-slate-600">{module.tools.length} tool{module.tools.length !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-emerald-400">Admin Panel</h2>
          <p className="text-xs text-slate-400 mt-1 truncate font-normal">{userEmail}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveSection('clients')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors w-full text-left text-menu ${
              activeSection === 'clients'
                ? 'bg-emerald-600 text-white font-medium'
                : 'text-slate-300 hover:bg-slate-700 font-medium'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Clients</span>
          </button>

          <button
            onClick={() => setShowPermissionsModal(true)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors w-full text-left text-menu text-slate-300 hover:bg-slate-700 font-medium"
          >
            <Shield className="w-5 h-5" />
            <span>Access Control</span>
          </button>

          <button
            onClick={() => { setActiveSection('contract-generator'); setActiveToolRoute(null); }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors w-full text-left text-menu ${
              activeSection === 'contract-generator'
                ? 'bg-emerald-600 text-white font-medium'
                : 'text-slate-300 hover:bg-slate-700 font-medium'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Contract Generator</span>
          </button>

          <div className="border-t border-slate-700 my-2 pt-2">
            {loading ? (
              <div className="text-center text-slate-400 py-4">Loading...</div>
            ) : (
              modules.map(module => {
                const isExpanded = expandedModules.has(module.id);
                const IconComponent = getIconComponent(module.icon);

                return (
                  <div key={module.id} className="mb-1">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-colors w-full text-left text-menu text-slate-300 hover:bg-slate-700 font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-5 h-5" />
                        <span>{module.display_name}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {isExpanded && isCoursesModule(module) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {courses
                          .filter(course => course.module_id === module.id)
                          .map(course => {
                            const isCourseExpanded = expandedCourses.has(course.id);
                            const CourseIconComponent = getIconComponent(course.icon);
                            const courseLessons = getLessonsForCourse(course, module.tools);

                            return (
                              <div key={course.id}>
                                <button
                                  onClick={() => toggleCourse(course.id)}
                                  className="flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors w-full text-left text-sm text-slate-300 hover:bg-slate-700 font-medium"
                                >
                                  <div className="flex items-center gap-3">
                                    <CourseIconComponent className="w-4 h-4" />
                                    <span>{course.display_name}</span>
                                  </div>
                                  {isCourseExpanded ? (
                                    <ChevronDown className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                </button>

                                {isCourseExpanded && courseLessons.length > 0 && (
                                  <div className="ml-4 mt-1 space-y-1">
                                    {courseLessons.map(tool => {
                                      const ToolIconComponent = getIconComponent(tool.icon);
                                      const isActive = activeToolRoute === tool.route;

                                      return (
                                        <button
                                          key={tool.id}
                                          onClick={() => handleToolClick(tool.route)}
                                          className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors w-full text-left text-xs font-medium ${
                                            isActive
                                              ? 'bg-emerald-600 text-white'
                                              : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                          }`}
                                        >
                                          <ToolIconComponent className="w-3.5 h-3.5" />
                                          <span>{tool.display_name}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {isExpanded && !isCoursesModule(module) && module.tools.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {module.tools.map(tool => {
                          const ToolIconComponent = getIconComponent(tool.icon);
                          const isActive = activeToolRoute === tool.route;

                          return (
                            <button
                              key={tool.id}
                              onClick={() => handleToolClick(tool.route)}
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors w-full text-left text-sm font-medium ${
                                isActive
                                  ? 'bg-emerald-600 text-white'
                                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                              }`}
                            >
                              <ToolIconComponent className="w-4 h-4" />
                              <span>{tool.display_name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-colors w-full text-left text-menu text-red-400 hover:text-red-300 font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-slate-600" />
              ) : (
                <Menu className="w-6 h-6 text-slate-600" />
              )}
            </button>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">Welcome</p>
                <p className="text-xs text-slate-500 font-normal">{userEmail}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                {userEmail[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderToolContent()}
          </div>
        </main>
      </div>

      {showPermissionsModal && (
        <PermissionsManager onClose={() => setShowPermissionsModal(false)} />
      )}
    </div>
  );
}

const ADMIN_LESSON_VIDEOS: Record<string, string> = {
  'courses/morning-rituals/intention-setting': 'vPdPk6Qeuts',
  'courses/morning-rituals/box-breathing': 'gg5Isdp8Aic',
  'courses/morning-rituals/affirmations': 'PJT82unfDHs',
  'courses/morning-rituals/version-2': 'vvW7qa3aW0g',
  'courses/morning-rituals/review-journal': 'mJMU2XjHSO4',
  'courses/morning-rituals/goal-of-the-week': 'o7Db3zif6Eo',
};

function AdminCourseLessonView({ route, modules }: { route: string; modules: ModuleWithTools[] }) {
  const coursesModule = modules.find(m => m.name === 'courses');
  const tool = coursesModule?.tools.find(t => t.route === route);
  const lessonDisplayName = tool?.display_name || '';
  const videoId = ADMIN_LESSON_VIDEOS[route];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-emerald-100 text-xs font-medium">7 Figure Ensuring Morning Rituals</p>
            <h2 className="text-xl font-bold text-white">{lessonDisplayName}</h2>
          </div>
        </div>
      </div>
      {videoId ? (
        <div
          className="p-6"
          onContextMenu={(e) => e.preventDefault()}
          style={{ userSelect: 'none' }}
        >
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&iv_load_policy=3&disablekb=0`}
              title={lessonDisplayName}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'transparent',
                zIndex: 5,
                pointerEvents: 'none',
              }}
            />
            <div
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '120px',
                height: '60px',
                background: 'transparent',
                zIndex: 10,
                cursor: 'default',
              }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400 text-center">
            If video is not visible in preview, it will work correctly on the published/deployed site. YouTube embeds are blocked in Bolt's sandbox preview.
          </p>
        </div>
      ) : (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Video coming soon</h3>
          <p className="text-slate-500">This lesson video is being prepared.</p>
        </div>
      )}
    </div>
  );
}
