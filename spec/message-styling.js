/*global mock, converse */

const { u, Promise, $msg } = converse.env;

describe("A incoming chat Message", function () {

    it("can be styled with XEP-0393 message styling hints",
        mock.initConverse(['rosterGroupsFetched', 'chatBoxesFetched'], {},
            function (done) {

        done();
    }));

    it("can have styling disabled",
        mock.initConverse(['rosterGroupsFetched', 'chatBoxesFetched'], {},
            async function (done, _converse) {

        const include_nick = false;
        await mock.waitForRoster(_converse, 'current', 2, include_nick);
        await mock.openControlBox(_converse);

        const msgtext = '> _ >';
        const sender_jid = mock.cur_names[1].replace(/ /g,'.').toLowerCase() + '@montague.lit';
        const msg = $msg({
                'from': sender_jid,
                'id': u.getUniqueId(),
                'to': _converse.connection.jid,
                'type': 'chat',
                'xmlns': 'jabber:client'
            }).c('body').t(msgtext).tree();

        await _converse.handleMessageStanza(msg);
        done();
    }));

    it("can be styled with span XEP-0393 message styling hints",
        mock.initConverse(['rosterGroupsFetched', 'chatBoxesFetched'], {},
            async function (done, _converse) {

        let msg_text, msg, msg_el;
        await mock.waitForRoster(_converse, 'current', 1);
        const contact_jid = mock.cur_names[0].replace(/ /g,'.').toLowerCase() + '@montague.lit';
        await mock.openChatBoxFor(_converse, contact_jid);
        const view = _converse.api.chatviews.get(contact_jid);

        msg_text = "This *message _contains_* styling hints! \`Here's *some* code\`";
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = view.el.querySelector('converse-chat-message-body');
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            'This <span class="styling-directive">*</span>'+
                '<b>message <span class="styling-directive">_</span><i>contains</i><span class="styling-directive">_</span></b>'+
                '<span class="styling-directive">*</span>'+
                ' styling hints! '+
                '<span class="styling-directive">`</span><code>Here\'s *some* code</code><span class="styling-directive">`</span>'
        );

        msg_text = "Here's a ~strikethrough section~";
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
                await _converse.handleMessageStanza(msg);
                await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            'Here\'s a <span class="styling-directive">~</span><del>strikethrough section</del><span class="styling-directive">~</span>');

        // Span directives containing hyperlinks
        msg_text = "~Check out this site: https://conversejs.org~"
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            '<span class="styling-directive">~</span>'+
            '<del>Check out this site: <a target="_blank" rel="noopener" href="https://conversejs.org/">https://conversejs.org</a></del>'+
            '<span class="styling-directive">~</span>');

        // Images inside directives aren't shown inline
        const base_url = 'https://conversejs.org';
        msg_text = `*${base_url}/logo/conversejs-filled.svg*`;
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            '<span class="styling-directive">*</span>'+
            '<b><a target="_blank" rel="noopener" href="https://conversejs.org/logo/conversejs-filled.svg">https://conversejs.org/logo/conversejs-filled.svg</a></b>'+
            '<span class="styling-directive">*</span>');

        // Emojis inside directives
        msg_text = `~ Hello! :poop: ~`;
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            '<span class="styling-directive">~</span><del> Hello! <span title=":poop:">💩</span> </del><span class="styling-directive">~</span>');

        // Span directives don't cross lines
        msg_text = "This *is not a styling hint \n * _But this is_!";
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            'This *is not a styling hint \n'+
            ' * <span class="styling-directive">_</span><i>But this is</i><span class="styling-directive">_</span>!');

        msg_text = `(There are three blocks in this body marked by parens,)\n (but there is no *formatting)\n (as spans* may not escape blocks.)`;
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') === msg_text);

        done();
    }));

    it("can be styled with block XEP-0393 message styling hints",
        mock.initConverse(['rosterGroupsFetched', 'chatBoxesFetched'], {},
            async function (done, _converse) {

        let msg_text, msg, msg_el;
        await mock.waitForRoster(_converse, 'current', 1);
        const contact_jid = mock.cur_names[0].replace(/ /g,'.').toLowerCase() + '@montague.lit';
        await mock.openChatBoxFor(_converse, contact_jid);
        const view = _converse.api.chatviews.get(contact_jid);

        msg_text = `Here's a code block: \n\`\`\`\nInside the code-block, <code>hello</code> we don't enable *styling hints* like ~these~\n\`\`\``;
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            'Here\'s a code block: \n'+
            '<div class="styling-directive">```</div><code class="block">Inside the code-block, &lt;code&gt;hello&lt;/code&gt; we don\'t enable *styling hints* like ~these~\n'+
            '</code><div class="styling-directive">```</div>'
        );

        msg_text = "```\nignored\n(println \"Hello, world!\")\n```\nThis should show up as monospace, preformatted text ^";
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            '<div class="styling-directive">```</div>'+
            '<code class="block">ignored\n(println "Hello, world!")\n</code>'+
            '<div class="styling-directive">```</div>\n'+
            'This should show up as monospace, preformatted text ^');


        msg_text = "```ignored\n (println \"Hello, world!\")\n ```\n\n This should not show up as monospace, *preformatted* text ^";
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            '```ignored\n (println "Hello, world!")\n ```\n\n'+
            ' This should not show up as monospace, '+
            '<span class="styling-directive">*</span><b>preformatted</b><span class="styling-directive">*</span> text ^');
        done();
    }));

    it("can be styled with quote XEP-0393 message styling hints",
        mock.initConverse(['rosterGroupsFetched', 'chatBoxesFetched'], {},
            async function (done, _converse) {

        let msg_text, msg, msg_el;
        await mock.waitForRoster(_converse, 'current', 1);
        const contact_jid = mock.cur_names[0].replace(/ /g,'.').toLowerCase() + '@montague.lit';
        await mock.openChatBoxFor(_converse, contact_jid);
        const view = _converse.api.chatviews.get(contact_jid);

        msg_text = `> This is quoted text\n>This is also quoted\nThis is not quoted`;
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            '<blockquote> This is quoted text\nThis is also quoted</blockquote>\nThis is not quoted');

        msg_text = `> This is *quoted* text\n>This is \`also _quoted_\`\nThis is not quoted`;
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            '<blockquote> This is <span class="styling-directive">*</span><b>quoted</b><span class="styling-directive">*</span> text\n'+
            'This is <span class="styling-directive">`</span><code>also _quoted_</code><span class="styling-directive">`</span></blockquote>\n'+
            'This is not quoted');

        msg_text = `> > This is doubly quoted text`;
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
                await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') === "<blockquote> <blockquote> This is doubly quoted text</blockquote></blockquote>");

        msg_text = ">```\n>ignored\n> <span></span> (println \"Hello, world!\")\n>```\n> This should show up as monospace, preformatted text ^";
        msg = mock.createChatMessage(_converse, contact_jid, msg_text)
        await _converse.handleMessageStanza(msg);
        await new Promise(resolve => view.model.messages.once('rendered', resolve));
        msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            '<blockquote>'+
                '<div class="styling-directive">```</div>'+
                '<code class="block">ignored\n &lt;span&gt;&lt;/span&gt; (println "Hello, world!")\n'+
                '</code><div class="styling-directive">```</div>\n'+
                ' This should show up as monospace, preformatted text ^'+
            '</blockquote>');
        done();
    }));
});


describe("A outgoing groupchat Message", function () {

    it("can be styled with span XEP-0393 message styling hints that contain mentions",
        mock.initConverse(['rosterGroupsFetched', 'chatBoxesFetched'], {},
            async function (done, _converse) {

        const muc_jid = 'lounge@montague.lit';
        await mock.openAndEnterChatRoom(_converse, muc_jid, 'romeo');
        const view = _converse.api.chatviews.get(muc_jid);
        const msg_text = "This *message mentions romeo*";
        const msg = $msg({
                from: 'lounge@montague.lit/gibson',
                id: u.getUniqueId(),
                to: 'romeo@montague.lit',
                type: 'groupchat'
            }).c('body').t(msg_text).up()
                .c('reference', {'xmlns':'urn:xmpp:reference:0', 'begin':'23', 'end':'29', 'type':'mention', 'uri':'xmpp:romeo@montague.lit'}).nodeTree;
        await view.model.handleMessageStanza(msg);
        const message = await u.waitUntil(() => view.el.querySelector('.chat-msg__text'));
        expect(message.classList.length).toEqual(1);

        const msg_el = Array.from(view.el.querySelectorAll('converse-chat-message-body')).pop();
        expect(msg_el.innerText).toBe(msg_text);
        await u.waitUntil(() => msg_el.innerHTML.replace(/<!---->/g, '') ===
            'This <span class="styling-directive">*</span><b>message mentions <span class="mention mention--self badge badge-info">romeo</span></b><span class="styling-directive">*</span>');
        done();
    }));
});
