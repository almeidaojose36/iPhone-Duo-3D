# Inside the iPhone Duo: narration script (v2)

Film 2 of Deep Teardown, built like *Inside the Machine* (PC): an **educational dissection**. For each
part: what it is, how it works, then a zoom to the micro level. No fault-finding.
Through-line: **one opening of the phone**, followed through the machine: the hinge turns, the screen
bends, power and heat cross the fold, the chip and cameras wake up.
Narrator: Kokoro `am_michael`, speed 1.03 (v1 was 0.95; +8% after review).

Facts: Apple's spec page (via iStore), Apple's interview on the thermal design (graphite pipe through the
hinge, metal-over-foam, second display engine, DRAM beside the processor, hinge of 100+ components),
iFixit's teardown (parts, battery capacities, layer structure). General engineering (how OLEDs, Li-ion
cells, GAA transistors, Hall sensors, image sensors, actuators and speakers work) is explained as such;
nothing unconfirmed is stated as a fact about this phone.
Pronunciation (voice only): A20 → "Ay twenty", OLED → "oh-led", NAND → "nand", 5G → "five G".

---

## 0 · Cold open  (project `c1`)

**[o1]** This phone is five point two millimeters thick. Thinner than any iPhone before it. And it folds in half.

**[o2]** To make glass bend without breaking, and carry power and heat across a moving joint, it takes a hinge with over a hundred parts, a ten-layer screen, and two separate batteries. So let's take it apart. Every part, every layer, all the way down to the atoms.

## 1 · The fold  (project `c1`)

**[f1]** This is the iPhone Duo. Closed, it's a phone you can hold in one hand. Open it, and it becomes a seven point six inch screen. The largest display ever put in an iPhone.

**[fw]** That inner screen is wide and short, about one point four to one. So a widescreen video fills much more of it than it would on a square folding screen.

**[f2]** To fold, the phone is split into two halves, each just over five millimeters thick, wrapped in a titanium frame. Everything a normal phone carries has to fit inside that space.

**[f3]** Each half has its own battery. The rear cameras sit on one side. A five point four inch outer screen sits on the back of the other. And holding them together is the hinge.

**[fx]** Compared with a regular iPhone, a few things move around. There's no Face ID: you unlock it with Touch ID in the side button. The volume buttons sit on the top edge. The outer screen is shaped like a D, square by the hinge and rounded on the outside, with its controls down the right edge. And the USB-C port sits low on the left half, out of the way when you use it like a laptop. Inside, it runs the same A20 Pro chip as the iPhone 18 Pro.

**[f4]** Every time you open it, dozens of parts move together in less than a second. So we'll follow that one moment through the phone: the hinge turning, the screen bending, power and heat crossing from one half to the other, and the phone waking up. It starts with the hinge.

## 2 · The hinge  (project `c2`)

**[h1]** From the outside, all you see is a titanium spine. Inside, there are no simple pins. Instead, there's a chain of small metal joints, each rotating through a limited range, a bit like the links of a watch band.

**[hs]** As a whole, the hinge splits into six jobs: hinges that let each side rotate, springs and cams that hold it, gears that keep both sides in step, and a channel in the middle for the cables. Most of it is mirrored, top and bottom.

**[h2]** The joints ride on curved guides. These make them move as if their pivot point were inside the screen itself, so the screen doesn't stretch or bunch up as it bends.

**[h3]** To keep both halves moving together, the joints are linked by rows of tiny synchronization gears. Push one side, and the other side follows by exactly the same angle.

**[h4]** Next to the gears are springs pressing on cams. When the phone is open, the cams lock together and hold it flat. As you fold it, the cams squeeze the springs, and the friction holds the phone at any angle from about fifteen to a hundred and sixty-five degrees: half open like a tiny laptop, or standing like a tent.

**[hm]** And in the last few degrees, magnets in the frame take over and pull the two halves shut.

**[h5]** When the phone closes, the screen doesn't fold flat. It curves into a teardrop-shaped loop, tucked inside the hinge, almost four millimeters across.

**[hp]** Think of a sheet of paper. Fold it around a wide curve, and it opens up smooth. Press it flat, and you get a sharp crease. That's why, on a new Duo, the crease is only about forty-eight microns deep, half the thickness of a sheet of paper.

**[h6]** In the middle sits a support bar. With the phone open, it holds the screen up along the fold, so it feels flat under your finger. When the phone closes, it drops down to make room for that loop.

**[h7]** Crossing the gap is a cable folded like an accordion. It carries power and data between the two halves, and it flexes every single time you open the phone.

**[he]** At the ends, the hinge is flat, under a titanium cover strong enough to take a knock, with no bumps to catch your finger. And even with all these moving parts, the phone is rated IP68 against dust and water.

**[h8]** The phone also knows exactly how far it's open. Foldables usually measure this with tiny magnetic sensors. A magnet in one half moves past a Hall-effect sensor in the other. Its magnetic field pushes the electrons flowing through the sensor to one side, and that creates a small voltage that changes with the angle.

**[h9]** Apps can read that angle live. And the A20 Pro has a second display engine, so it can drive the inner and outer screens at the same time, and hand the picture from one to the other as you open the phone.

**[h10]** Next, the screen that bends over all of this.

## 3 · The screen  (project `c3`)

**[d1]** A normal phone screen sits under thick, hard glass. Glass like that can't fold. So the inner screen is a flexible OLED panel, built from more than ten ultrathin layers and adhesives.

**[d2]** Why does thin bend more easily? When a sheet bends, its outside stretches and its inside squeezes. The thinner the sheet, the less each surface has to stretch. That's why every layer here is made as thin as possible. Even glass can bend, if it's thin enough.

**[d3]** On top is a flexible polymer cover. Under a microscope, its surface is covered in tiny bumps: the nano-texture. It scatters reflections, so the screen shows less glare, and the reflection off the crease almost disappears. It also makes the surface harder to scratch. And this cover can be replaced on its own.

**[dg]** Under it is a layer of ultra-thin glass, thinner than a sheet of paper, and there's another one below the panel. Glass this thin bends, and it spreads the pressure of a fingertip or a pencil, so the screen resists dents.

**[d4]** Below it is the touch layer, a fine metal mesh. Your finger changes the electric field between the wires, and the phone works out exactly where you touched.

**[d5]** Then, instead of a polarizer, there are color filters: tiny colored windows over every subpixel, framed by a black grid that soaks up light from the room.

**[d6]** Under them are the light sources themselves: red, green and blue organic LEDs. Some subpixels are oval, turned in different directions, to reduce diffraction.

**[d7]** Let's zoom into a single subpixel. It's a sandwich of organic layers between two electrodes. Electrons enter from the top, and holes, the gaps where electrons are missing, enter from the bottom. When they meet in the middle layer, they release their energy as a tiny flash of light. The material in that layer decides the color.

**[d8]** Each subpixel is switched on and off by thin-film transistors in the layer below, many times every second.

**[d9]** There's even a camera hiding under this screen. Around it, small gaps in the pixel pattern let light pass through to the lens.

**[d10]** At the bottom, a plastic base bends instead of shattering, a soft foam cushion absorbs the press of your finger, and a metal support plate gives the whole panel its strength. Next: how one phone runs on two batteries.

## 4 · Two batteries  (project `c4`)

**[b1]** A phone this thin has no room for one big battery. So the iPhone Duo has two, one in each half.

**[b2]** This L-shaped cell holds seven and a half watt-hours, and wraps around the cameras. The larger cell holds eleven point six. Together, that's about nineteen watt-hours, which Apple rates for up to twenty-four hours of typical use.

**[b3]** Each cell is wrapped in a thin metal shell. Inside, very thin sheets are stacked together: a cathode, a separator, and an anode, soaked in a liquid electrolyte.

**[b4]** Let's look closer. The cathode is a metal oxide that holds lithium. When you charge the phone, lithium ions are pulled out of it, through tiny holes in the separator, and packed in between the layers of carbon in the anode.

**[b5]** When you use the phone, they flow back. Each ion that crosses sends one electron around the circuit, and that stream of electrons powers everything you've seen so far.

**[b6]** The cells are held in with an adhesive that lets go when a small electric current runs through it. The current changes the glue right at the surface, so it loses its grip. Even a nine-volt battery is enough.

**[b7]** And because the charging hardware sits in only one half, the other battery charges through that accordion cable in the hinge. With a sixty-watt charger, the pair reaches fifty percent in about twenty minutes. Next: the brains.

## 5 · The brains  (project `c5`)

**[l1]** For years, iPhones have used stacked logic boards: two circuit boards sandwiched together to save space. The iPhone Duo spreads everything out on a single layer.

**[l2]** At its center is the A20 Pro, Apple's first iPhone chip made on a two-nanometer process. It has a six-core CPU and a seven-core GPU with neural accelerators, and its memory sits right beside it, instead of stacked on top.

**[l3]** Let's go inside. The chip holds billions of transistors: tiny switches that turn on and off to do every calculation.

**[l4]** At two nanometers, they have a new shape. The channel, where current flows, is a stack of thin silicon ribbons. And the gate wraps all the way around each ribbon, like a hand around a bundle of straws.

**[l5]** Put a voltage on the gate, and current flows through the ribbons. Remove it, and the flow stops. Because the gate surrounds the channel on every side, it controls it tightly, so less current leaks away when the switch is off.

**[l6]** Next to the A20 Pro is the NAND flash, where your photos, apps and files live, up to two terabytes. Here's Apple's own C2 modem, for 5G, and the N1 wireless chip, for Wi-Fi seven, Bluetooth six and Thread.

**[l7]** And this is the power management chip. It turns battery power into dozens of different voltages for everything on the board.

**[l8]** Billions of switches make heat, and a phone this thin has nowhere to hide it. So the A20 Pro presses into a soft metal-over-foam layer, which carries the heat up into a vapor chamber.

**[l9]** Inside the chamber, a little liquid boils over the hot chip. The vapor spreads out, condenses where it's cooler, and flows back to boil again.

**[l10]** But all of this sits in one half of the phone. So a flexible graphite pipe runs through the hinge, carrying heat across the fold, so both halves of the frame can shed it. Next: the cameras.

## 6 · Cameras  (project `c6`)

**[k1]** There are four cameras in this phone, in three modules.

**[k2]** On the back is the forty-eight megapixel Fusion main camera. Its f one point six lens lets in a lot of light, and its whole sensor shifts to cancel out the shake of your hands.

**[k3]** Beside it is a forty-eight megapixel ultra wide, with a hundred and twenty degree view. It can also focus close enough for macro shots. Both are the same class of camera as the standard iPhone's.

**[k4]** There's no separate telephoto lens. Instead, the main camera uses the middle of its sensor for a two times zoom, at twelve megapixels.

**[k5]** Each camera is a stack of tiny lenses, focusing light onto an image sensor.

**[k6]** Let's zoom into the sensor. It's covered in millions of light wells called photodiodes. Over each one sits a tiny lens and a red, green or blue filter, in a repeating pattern with twice as many greens, because our eyes are most sensitive to green.

**[k7]** When light hits a photodiode, it knocks electrons loose. The brighter the light, the more electrons collect. The chip counts them, pixel by pixel, and blends neighboring colors to build the image.

**[k8]** For selfies, there's a twelve megapixel Center Stage camera on the outer screen, in a module so thin it fits inside a five millimeter half. And on the inside, the camera under the screen.

**[k9]** Folding adds new tricks, too. Stand it up like a tent, and Smart Capture takes the photo when everyone's ready. Or turn on dual-screen preview, so the people in the photo can see themselves on the outer screen. Next: sound and touch.

## 7 · Sound and touch  (project `c7`)

**[s1]** Even in a phone this thin, there's room for sound and touch.

**[s2]** This is the Taptic Engine. Inside, a heavy magnet hangs on springs, next to a coil of wire.

**[s3]** When current flows through the coil, it pushes the magnet one way. Reverse the current, and it pulls it back. Shake it back and forth at just the right rhythm, and you feel a crisp tap, a click, or a buzz.

**[s4]** The speakers work in a similar way. A coil attached to a thin diaphragm sits in a magnet's field. Music becomes a changing current, the coil moves the diaphragm in and out, and the diaphragm pushes the air to make sound.

**[s5]** Tiny drivers need air behind them to sound full, so each one sits in a carefully shaped chamber. And there are two of them, for stereo sound. Next: putting it all back together.

## 8 · Outro  (project `c8`)

**[v1]** So that's the journey through the iPhone Duo. You open it, and a hinge with more than a hundred parts turns, held in step by gears and springs.

**[v2]** The screen bends into a gentle loop, its organic LEDs shining through color filters and a soft polymer cover.

**[v3]** Power flows from two batteries, one charging across the fold, to billions of nanosheet transistors in the A20 Pro, while heat travels the other way, through a graphite pipe in the hinge.

**[v4]** All of it, in a phone five point two millimeters thick.

**[v5]** If you enjoyed this journey inside the iPhone Duo, subscribe, and we'll take apart something new next time.
