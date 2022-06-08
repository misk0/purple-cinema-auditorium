
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\client\Seat.svelte generated by Svelte v3.48.0 */
    const file$3 = "src\\client\\Seat.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let t_value = /*seat*/ ctx[0].type + "";
    	let t;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*seatColor*/ ctx[1]) + " svelte-hkd6b0"));
    			add_location(div, file$3, 19, 0, 485);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*changeSeatState*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*seat*/ 1 && t_value !== (t_value = /*seat*/ ctx[0].type + "")) set_data_dev(t, t_value);

    			if (dirty & /*seatColor*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(/*seatColor*/ ctx[1]) + " svelte-hkd6b0"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Seat', slots, []);
    	const dispatch = createEventDispatcher();
    	let { seat } = $$props;
    	let seatColor = seat.type === "X" ? "gray" : "green";

    	function changeSeatState() {
    		dispatch('changeSeatState', { seat });

    		if (seat.type === "X") {
    			$$invalidate(1, seatColor = "green");
    			$$invalidate(0, seat.type = "F", seat);
    		} else {
    			$$invalidate(1, seatColor = "gray");
    			$$invalidate(0, seat.type = "X", seat);
    		}
    	}

    	const writable_props = ['seat'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Seat> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('seat' in $$props) $$invalidate(0, seat = $$props.seat);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		seat,
    		seatColor,
    		changeSeatState
    	});

    	$$self.$inject_state = $$props => {
    		if ('seat' in $$props) $$invalidate(0, seat = $$props.seat);
    		if ('seatColor' in $$props) $$invalidate(1, seatColor = $$props.seatColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [seat, seatColor, changeSeatState];
    }

    class Seat extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { seat: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Seat",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*seat*/ ctx[0] === undefined && !('seat' in props)) {
    			console.warn("<Seat> was created without expected prop 'seat'");
    		}
    	}

    	get seat() {
    		throw new Error("<Seat>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set seat(value) {
    		throw new Error("<Seat>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\client\RowSeats.svelte generated by Svelte v3.48.0 */
    const file$2 = "src\\client\\RowSeats.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (7:4) {#each seats as seat, index (index)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let seat;
    	let current;

    	seat = new Seat({
    			props: { seat: /*seat*/ ctx[2] },
    			$$inline: true
    		});

    	seat.$on("changeSeatState", /*changeSeatState_handler*/ ctx[1]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(seat.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(seat, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const seat_changes = {};
    			if (dirty & /*seats*/ 1) seat_changes.seat = /*seat*/ ctx[2];
    			seat.$set(seat_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(seat.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(seat.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(seat, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(7:4) {#each seats as seat, index (index)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*seats*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*index*/ ctx[4];
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "svelte-ubyvcm");
    			add_location(div, file$2, 5, 0, 90);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*seats*/ 1) {
    				each_value = /*seats*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RowSeats', slots, []);
    	let { seats = [] } = $$props;
    	const writable_props = ['seats'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RowSeats> was created with unknown prop '${key}'`);
    	});

    	function changeSeatState_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('seats' in $$props) $$invalidate(0, seats = $$props.seats);
    	};

    	$$self.$capture_state = () => ({ Seat, seats });

    	$$self.$inject_state = $$props => {
    		if ('seats' in $$props) $$invalidate(0, seats = $$props.seats);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [seats, changeSeatState_handler];
    }

    class RowSeats extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { seats: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RowSeats",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get seats() {
    		throw new Error("<RowSeats>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set seats(value) {
    		throw new Error("<RowSeats>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\client\CreateAuditorium.svelte generated by Svelte v3.48.0 */

    const file$1 = "src\\client\\CreateAuditorium.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let label0;
    	let t2;
    	let input0;
    	let t3;
    	let label1;
    	let t4;
    	let input1;
    	let t5;
    	let label2;
    	let t6;
    	let input2;
    	let t7;
    	let label3;
    	let t8;
    	let input3;
    	let t9;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Create auditorium";
    			t1 = space();
    			label0 = element("label");
    			t2 = text("Auditorium name: \r\n        ");
    			input0 = element("input");
    			t3 = space();
    			label1 = element("label");
    			t4 = text("Theatre: \r\n        ");
    			input1 = element("input");
    			t5 = space();
    			label2 = element("label");
    			t6 = text("Rows: \r\n        ");
    			input2 = element("input");
    			t7 = space();
    			label3 = element("label");
    			t8 = text("Columns: \r\n        ");
    			input3 = element("input");
    			t9 = space();
    			button = element("button");
    			button.textContent = "Create";
    			add_location(h1, file$1, 22, 4, 572);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$1, 25, 8, 648);
    			add_location(label0, file$1, 23, 4, 604);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$1, 29, 8, 751);
    			add_location(label1, file$1, 27, 4, 715);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "min", "1");
    			attr_dev(input2, "max", "10");
    			add_location(input2, file$1, 33, 8, 848);
    			add_location(label2, file$1, 31, 4, 815);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "min", "1");
    			attr_dev(input3, "max", "15");
    			add_location(input3, file$1, 37, 8, 956);
    			add_location(label3, file$1, 35, 4, 920);
    			add_location(button, file$1, 40, 4, 1030);
    			attr_dev(div, "class", "svelte-kzcrhm");
    			add_location(div, file$1, 21, 0, 561);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, label0);
    			append_dev(label0, t2);
    			append_dev(label0, input0);
    			set_input_value(input0, /*auditoriumName*/ ctx[0]);
    			append_dev(div, t3);
    			append_dev(div, label1);
    			append_dev(label1, t4);
    			append_dev(label1, input1);
    			set_input_value(input1, /*theatreName*/ ctx[1]);
    			append_dev(div, t5);
    			append_dev(div, label2);
    			append_dev(label2, t6);
    			append_dev(label2, input2);
    			set_input_value(input2, /*rows*/ ctx[2]);
    			append_dev(div, t7);
    			append_dev(div, label3);
    			append_dev(label3, t8);
    			append_dev(label3, input3);
    			set_input_value(input3, /*cols*/ ctx[3]);
    			append_dev(div, t9);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[8]),
    					listen_dev(button, "click", /*submitData*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*auditoriumName*/ 1 && input0.value !== /*auditoriumName*/ ctx[0]) {
    				set_input_value(input0, /*auditoriumName*/ ctx[0]);
    			}

    			if (dirty & /*theatreName*/ 2 && input1.value !== /*theatreName*/ ctx[1]) {
    				set_input_value(input1, /*theatreName*/ ctx[1]);
    			}

    			if (dirty & /*rows*/ 4 && to_number(input2.value) !== /*rows*/ ctx[2]) {
    				set_input_value(input2, /*rows*/ ctx[2]);
    			}

    			if (dirty & /*cols*/ 8 && to_number(input3.value) !== /*cols*/ ctx[3]) {
    				set_input_value(input3, /*cols*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CreateAuditorium', slots, []);
    	let auditoriumName, theatreName, rows = 1, cols = 1;

    	async function submitData(evt) {
    		let data = {
    			'name': auditoriumName,
    			'theatre': theatreName,
    			'rows': rows.toString(),
    			'columns': cols.toString()
    		};

    		await fetch('http://localhost:3333/auditoriums', {
    			method: 'POST',
    			headers: { 'Content-Type': 'application/json' },
    			body: JSON.stringify(data)
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CreateAuditorium> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		auditoriumName = this.value;
    		$$invalidate(0, auditoriumName);
    	}

    	function input1_input_handler() {
    		theatreName = this.value;
    		$$invalidate(1, theatreName);
    	}

    	function input2_input_handler() {
    		rows = to_number(this.value);
    		$$invalidate(2, rows);
    	}

    	function input3_input_handler() {
    		cols = to_number(this.value);
    		$$invalidate(3, cols);
    	}

    	$$self.$capture_state = () => ({
    		auditoriumName,
    		theatreName,
    		rows,
    		cols,
    		submitData
    	});

    	$$self.$inject_state = $$props => {
    		if ('auditoriumName' in $$props) $$invalidate(0, auditoriumName = $$props.auditoriumName);
    		if ('theatreName' in $$props) $$invalidate(1, theatreName = $$props.theatreName);
    		if ('rows' in $$props) $$invalidate(2, rows = $$props.rows);
    		if ('cols' in $$props) $$invalidate(3, cols = $$props.cols);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		auditoriumName,
    		theatreName,
    		rows,
    		cols,
    		submitData,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	];
    }

    class CreateAuditorium extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CreateAuditorium",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\client\App.svelte generated by Svelte v3.48.0 */

    const { console: console_1 } = globals;
    const file = "src\\client\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (62:4) {#each auditoriums as auditorium }
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*auditorium*/ ctx[10].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*auditorium*/ ctx[10]._id;
    			option.value = option.__value;
    			add_location(option, file, 62, 5, 1408);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*auditoriums*/ 1 && t_value !== (t_value = /*auditorium*/ ctx[10].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*auditoriums*/ 1 && option_value_value !== (option_value_value = /*auditorium*/ ctx[10]._id)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(62:4) {#each auditoriums as auditorium }",
    		ctx
    	});

    	return block;
    }

    // (68:2) {#if selectedAud !== undefined}
    function create_if_block(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = { length: /*selectedAud*/ ctx[2].rows };
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[9];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*extractSeatsForRow, selectedAud, changeSeatState*/ 52) {
    				each_value = { length: /*selectedAud*/ ctx[2].rows };
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(68:2) {#if selectedAud !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (69:3) {#each {length: selectedAud.rows} as _, i (i)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let rowseats;
    	let current;

    	rowseats = new RowSeats({
    			props: {
    				seats: /*extractSeatsForRow*/ ctx[4](/*i*/ ctx[9])
    			},
    			$$inline: true
    		});

    	rowseats.$on("changeSeatState", /*changeSeatState*/ ctx[5]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(rowseats.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(rowseats, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const rowseats_changes = {};
    			if (dirty & /*selectedAud*/ 4) rowseats_changes.seats = /*extractSeatsForRow*/ ctx[4](/*i*/ ctx[9]);
    			rowseats.$set(rowseats_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rowseats.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rowseats.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(rowseats, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(69:3) {#each {length: selectedAud.rows} as _, i (i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let h1;
    	let t1;
    	let div2;
    	let div1;
    	let select;
    	let t2;
    	let t3;
    	let createauditorium;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*auditoriums*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block = /*selectedAud*/ ctx[2] !== undefined && create_if_block(ctx);
    	createauditorium = new CreateAuditorium({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Auditorium configuration";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			create_component(createauditorium.$$.fragment);
    			attr_dev(h1, "class", "svelte-10mpxtb");
    			add_location(h1, file, 56, 2, 1211);
    			add_location(div0, file, 55, 1, 1203);
    			if (/*selectedId*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[6].call(select));
    			add_location(select, file, 60, 3, 1302);
    			attr_dev(div1, "class", "selectbox svelte-10mpxtb");
    			add_location(div1, file, 59, 2, 1275);
    			attr_dev(div2, "class", "body svelte-10mpxtb");
    			add_location(div2, file, 58, 1, 1254);
    			attr_dev(main, "class", "svelte-10mpxtb");
    			add_location(main, file, 54, 0, 1195);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, h1);
    			append_dev(main, t1);
    			append_dev(main, div2);
    			append_dev(div2, div1);
    			append_dev(div1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectedId*/ ctx[1]);
    			append_dev(div2, t2);
    			if (if_block) if_block.m(div2, null);
    			append_dev(main, t3);
    			mount_component(createauditorium, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[6]),
    					listen_dev(select, "change", /*chooseAuditorium*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*auditoriums*/ 1) {
    				each_value_1 = /*auditoriums*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*selectedId, auditoriums*/ 3) {
    				select_option(select, /*selectedId*/ ctx[1]);
    			}

    			if (/*selectedAud*/ ctx[2] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*selectedAud*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(createauditorium.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(createauditorium.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    			destroy_component(createauditorium);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let auditoriums = [];
    	let selectedId;
    	let selectedAud;

    	onMount(async () => {
    		fetch('http://localhost:3333/auditoriums').then(response => response.json()).then(data => {
    			$$invalidate(0, auditoriums = data);
    		});
    	});

    	function chooseAuditorium(evt) {
    		$$invalidate(2, selectedAud = auditoriums.find(aud => aud._id == selectedId));
    		console.log(selectedAud);
    	}

    	function extractSeatsForRow(rowNumber) {
    		let seats = selectedAud.seats;
    		let returnRow = [];

    		seats.forEach(element => {
    			if (element.row == rowNumber) returnRow.push(element);
    		});

    		return returnRow;
    	}

    	async function changeSeatState(evt) {
    		let seat = evt.detail.seat;
    		const seatType = seat.type === "X" ? "F" : "X";
    		console.log(seat);

    		const res = await fetch('http://localhost:3333/auditoriums/editSeat/' + selectedAud._id, {
    			method: 'PUT',
    			headers: { 'Content-Type': 'application/json' },
    			body: JSON.stringify({
    				row: seat.row,
    				column: seat.col,
    				type: seatType
    			})
    		});

    		const json = await res.json();
    		console.log(json);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selectedId = select_value(this);
    		$$invalidate(1, selectedId);
    		$$invalidate(0, auditoriums);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		RowSeats,
    		CreateAuditorium,
    		auditoriums,
    		selectedId,
    		selectedAud,
    		chooseAuditorium,
    		extractSeatsForRow,
    		changeSeatState
    	});

    	$$self.$inject_state = $$props => {
    		if ('auditoriums' in $$props) $$invalidate(0, auditoriums = $$props.auditoriums);
    		if ('selectedId' in $$props) $$invalidate(1, selectedId = $$props.selectedId);
    		if ('selectedAud' in $$props) $$invalidate(2, selectedAud = $$props.selectedAud);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		auditoriums,
    		selectedId,
    		selectedAud,
    		chooseAuditorium,
    		extractSeatsForRow,
    		changeSeatState,
    		select_change_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
