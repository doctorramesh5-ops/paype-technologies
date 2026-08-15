// PayPe Email Worker
// Deploy as: paype-email.doctorramesh5.workers.dev
// Uses Resend API (free 3000 emails/month)

export default {
  async fetch(request, env) {

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST only' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let body;
    try { body = await request.json(); }
    catch(e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { type, to, name, plan, amount, paymentId, credits, date } = body;

    if (!to || !type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const RESEND_API_KEY = env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let subject, html;

    if (type === 'invoice') {
      const invoiceNum = 'INV-' + Date.now().toString().slice(-8);
      const planNames = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };
      const planCredits = { starter: 100, pro: 500, enterprise: 2000 };
      const gst = Math.round(parseInt(amount) * 0.18);
      const subtotal = parseInt(amount) - gst;

      subject = `Invoice ${invoiceNum} - PayPe Technologies`;
      html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
  body{margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;color:#333}
  .wrap{max-width:600px;margin:0 auto;background:#fff}
  .header{background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px;text-align:center}
  .header h1{color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px}
  .header p{color:rgba(255,255,255,.85);margin:6px 0 0;font-size:14px}
  .logo{background:#000;color:#f59e0b;width:44px;height:44px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;margin-bottom:12px;line-height:44px}
  .body{padding:32px}
  .invoice-info{display:flex;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:16px}
  .ii-block h4{margin:0 0 4px;font-size:11px;text-transform:uppercase;color:#999;letter-spacing:1px}
  .ii-block p{margin:0;font-size:14px;font-weight:600;color:#333}
  .table{width:100%;border-collapse:collapse;margin-bottom:20px}
  .table th{background:#f8f8f8;padding:12px 16px;text-align:left;font-size:12px;text-transform:uppercase;color:#999;letter-spacing:1px;border-bottom:2px solid #eee}
  .table td{padding:14px 16px;border-bottom:1px solid #f0f0f0;font-size:14px}
  .total-row{background:#fff9f0}
  .total-row td{font-weight:700;color:#f59e0b;font-size:16px;border-bottom:none}
  .badge{display:inline-block;background:#fff9f0;color:#f59e0b;border:1px solid rgba(245,158,11,.3);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600}
  .credits-box{background:linear-gradient(135deg,rgba(245,158,11,.08),rgba(239,68,68,.04));border:1px solid rgba(245,158,11,.2);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center}
  .credits-box h3{margin:0 0 6px;font-size:22px;color:#f59e0b}
  .credits-box p{margin:0;font-size:13px;color:#777}
  .footer{background:#f8f8f8;padding:24px 32px;text-align:center;border-top:1px solid #eee}
  .footer p{margin:0;font-size:12px;color:#999;line-height:1.8}
  .footer a{color:#f59e0b;text-decoration:none}
  .paid-stamp{display:inline-block;border:3px solid #22c55e;color:#22c55e;border-radius:8px;padding:6px 18px;font-size:18px;font-weight:900;letter-spacing:2px;transform:rotate(-5deg);margin-bottom:16px}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">P</div>
    <h1>PayPe Technologies</h1>
    <p>Tax Invoice / Receipt</p>
  </div>

  <div class="body">
    <div style="text-align:center;margin-bottom:24px">
      <div class="paid-stamp">✓ PAID</div>
    </div>

    <div class="invoice-info">
      <div class="ii-block">
        <h4>Invoice Number</h4>
        <p>${invoiceNum}</p>
      </div>
      <div class="ii-block">
        <h4>Invoice Date</h4>
        <p>${date || new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'})}</p>
      </div>
      <div class="ii-block">
        <h4>Payment ID</h4>
        <p style="font-size:12px;color:#777">${paymentId || '—'}</p>
      </div>
      <div class="ii-block">
        <h4>Status</h4>
        <p><span class="badge">✓ Paid</span></p>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:16px">
      <div>
        <h4 style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:#999;letter-spacing:1px">From</h4>
        <p style="margin:0;font-weight:700">PayPe Technologies Pvt. Ltd.</p>
        <p style="margin:4px 0 0;font-size:13px;color:#777">277/1A, Annamalai Industrial Park<br/>Kalapatti, Coimbatore – 641048<br/>Tamil Nadu, India<br/>GST: 33AAMCP7960K1ZU<br/>itsupport@paype.co.in</p>
      </div>
      <div>
        <h4 style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:#999;letter-spacing:1px">Bill To</h4>
        <p style="margin:0;font-weight:700">${name || 'Customer'}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#777">${to}<br/>${body.phone ? body.phone : ''}</p>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Period</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${planNames[plan] || plan} Plan</strong><br/>
            <span style="font-size:12px;color:#777">AI App Builder Subscription · ${planCredits[plan] || credits || 100} Credits</span>
          </td>
          <td style="color:#777;font-size:13px">Monthly</td>
          <td style="text-align:right">₹${subtotal.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="color:#777;font-size:13px">GST (18%)</td>
          <td></td>
          <td style="text-align:right;color:#777">₹${gst.toLocaleString('en-IN')}</td>
        </tr>
        <tr class="total-row">
          <td><strong>Total Paid</strong></td>
          <td></td>
          <td style="text-align:right"><strong>₹${parseInt(amount).toLocaleString('en-IN')}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="credits-box">
      <h3>💎 ${planCredits[plan] || credits || 100} Credits Added</h3>
      <p>Your account has been credited. Start building your AI apps now!</p>
    </div>

    <div style="text-align:center">
      <a href="https://paype.co.in/app" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#000;font-weight:700;border-radius:10px;text-decoration:none;font-size:15px">Start Building →</a>
    </div>
  </div>

  <div class="footer">
    <p>
      <strong>PayPe Technologies Private Limited</strong><br/>
      CIN: U74994TN2022PTC151114 · GST: 33AAMCP7960K1ZU<br/>
      <a href="https://paype.co.in">paype.co.in</a> · <a href="mailto:itsupport@paype.co.in">itsupport@paype.co.in</a><br/>
      This is a computer-generated invoice and does not require a signature.
    </p>
  </div>
</div>
</body>
</html>`;
    }

    // Send email via Resend API
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + RESEND_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'PayPe Technologies <invoice@paype.co.in>',
          to: [to],
          subject: subject,
          html: html
        })
      });

      const emailData = await emailRes.json();

      if (emailData.id) {
        return new Response(JSON.stringify({ success: true, emailId: emailData.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ error: 'Email send failed', detail: emailData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch(e) {
      return new Response(JSON.stringify({ error: 'Email error: ' + e.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
