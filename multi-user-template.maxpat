{
    "patcher": {
        "fileversion": 1,
        "appversion": {
            "major": 9,
            "minor": 0,
            "revision": 0,
            "architecture": "x64",
            "modernui": 1
        },
        "classnamespace": "box",
        "rect": [
            80.0,
            80.0,
            1320.0,
            980.0
        ],
        "openinpresentation": 1,
        "gridsize": [
            15.0,
            15.0
        ],
        "boxes": [
            {
                "box": {
                    "id": "obj-title",
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        12.0,
                        800.0,
                        28.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        16.0,
                        800.0,
                        24.0
                    ],
                    "fontsize": 16.0,
                    "text": "multi-user-template \u2014 phones as Max controllers (lobby \u2192 roles \u2192 stage with all-the-sensors)"
                }
            },
            {
                "box": {
                    "id": "obj-desc",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        44.0,
                        900.0,
                        22.0
                    ],
                    "text": "Phones on the same wifi open the URL below, enter a name, pick role(s), wait in the lobby. An admin (password-gated) presses START to move everyone to the stage."
                }
            },
            {
                "box": {
                    "id": "obj-h-cfg",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        84.0,
                        600.0,
                        20.0
                    ],
                    "text": "\u2500\u2500 CONFIG \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
                }
            },
            {
                "box": {
                    "id": "obj-c-port",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        112.0,
                        100.0,
                        20.0
                    ],
                    "text": "HTTP Port"
                }
            },
            {
                "box": {
                    "id": "obj-n-port",
                    "maxclass": "number",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [
                        "",
                        "bang"
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "httpPort",
                            "parameter_shortname": "httpPort",
                            "parameter_type": 0,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                8080
                            ]
                        }
                    },
                    "patching_rect": [
                        130.0,
                        110.0,
                        70.0,
                        24.0
                    ],
                    "minimum": 1,
                    "maximum": 65535
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-m-port",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        210.0,
                        110.0,
                        100.0,
                        22.0
                    ],
                    "text": "setport $1"
                }
            },
            {
                "box": {
                    "id": "obj-c-oscport",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        144.0,
                        100.0,
                        20.0
                    ],
                    "text": "OSC Port (UDP)"
                }
            },
            {
                "box": {
                    "id": "obj-n-oscport",
                    "maxclass": "number",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [
                        "",
                        "bang"
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "oscPort",
                            "parameter_shortname": "oscPort",
                            "parameter_type": 0,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                7400
                            ]
                        }
                    },
                    "patching_rect": [
                        130.0,
                        142.0,
                        70.0,
                        24.0
                    ],
                    "minimum": 1,
                    "maximum": 65535
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-m-oscport",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        210.0,
                        142.0,
                        120.0,
                        22.0
                    ],
                    "text": "setoscport $1"
                }
            },
            {
                "box": {
                    "id": "obj-b-pw",
                    "presentation": 1,
                    "presentation_rect": [
                        720.0,
                        170.0,
                        32.0,
                        32.0
                    ],
                    "maxclass": "button",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "bang"
                    ],
                    "patching_rect": [
                        20.0,
                        174.0,
                        28.0,
                        28.0
                    ],
                    "bgcolor": [
                        1.0,
                        0.72,
                        0.3,
                        1.0
                    ]
                }
            },
            {
                "box": {
                    "id": "obj-c-pw-l",
                    "presentation": 1,
                    "presentation_rect": [
                        754.0,
                        176.0,
                        200.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        54.0,
                        178.0,
                        240.0,
                        20.0
                    ],
                    "text": "Set admin password (blank = no password)"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-dialog-pw",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 3,
                    "outlettype": [
                        "",
                        "",
                        ""
                    ],
                    "patching_rect": [
                        20.0,
                        206.0,
                        360.0,
                        22.0
                    ],
                    "text": "dialog @label \"Admin password \u2014 leave blank to disable\" @mask 1"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-p-pw",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        20.0,
                        234.0,
                        130.0,
                        22.0
                    ],
                    "text": "prepend setpassword"
                }
            },
            {
                "box": {
                    "id": "obj-c-pw-hint",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        380.0,
                        176.0,
                        600.0,
                        20.0
                    ],
                    "text": "Click \u2192 dialog \u2192 type \u2192 OK. Blank password means \"admin\" is a free role; any value enables a password challenge."
                }
            },
            {
                "box": {
                    "id": "obj-c-roles",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        232.0,
                        100.0,
                        20.0
                    ],
                    "text": "Roles (space-sep)"
                }
            },
            {
                "box": {
                    "id": "obj-t-roles",
                    "maxclass": "textedit",
                    "numinlets": 1,
                    "numoutlets": 4,
                    "outlettype": [
                        "",
                        "int",
                        "",
                        ""
                    ],
                    "patching_rect": [
                        130.0,
                        230.0,
                        240.0,
                        26.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "roles",
                            "parameter_shortname": "roles",
                            "parameter_type": 3,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                "role1 role2 role3"
                            ]
                        }
                    },
                    "text": "role1 role2 role3"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-p-roles",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        130.0,
                        260.0,
                        110.0,
                        22.0
                    ],
                    "text": "prepend setroles"
                }
            },
            {
                "box": {
                    "id": "obj-c-roles-hint",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        380.0,
                        232.0,
                        460.0,
                        20.0
                    ],
                    "text": "\"admin\" is implicit and reserved. Edit + Enter to apply."
                }
            },
            {
                "box": {
                    "id": "obj-h-trans",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        280.0,
                        600.0,
                        20.0
                    ],
                    "text": "\u2500\u2500 TRANSPORT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
                }
            },
            {
                "box": {
                    "id": "obj-b-start",
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        170.0,
                        32.0,
                        32.0
                    ],
                    "maxclass": "button",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "bang"
                    ],
                    "patching_rect": [
                        20.0,
                        312.0,
                        28.0,
                        28.0
                    ],
                    "bgcolor": [
                        0.2,
                        0.6,
                        0.2,
                        1.0
                    ]
                }
            },
            {
                "box": {
                    "id": "obj-c-start",
                    "presentation": 1,
                    "presentation_rect": [
                        56.0,
                        178.0,
                        60.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        54.0,
                        316.0,
                        60.0,
                        20.0
                    ],
                    "text": "START"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-m-start",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        20.0,
                        346.0,
                        60.0,
                        22.0
                    ],
                    "text": "start"
                }
            },
            {
                "box": {
                    "id": "obj-b-stop",
                    "presentation": 1,
                    "presentation_rect": [
                        130.0,
                        170.0,
                        32.0,
                        32.0
                    ],
                    "maxclass": "button",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "bang"
                    ],
                    "patching_rect": [
                        130.0,
                        312.0,
                        28.0,
                        28.0
                    ],
                    "bgcolor": [
                        0.7,
                        0.3,
                        0.3,
                        1.0
                    ]
                }
            },
            {
                "box": {
                    "id": "obj-c-stop",
                    "presentation": 1,
                    "presentation_rect": [
                        166.0,
                        178.0,
                        60.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        164.0,
                        316.0,
                        60.0,
                        20.0
                    ],
                    "text": "STOP"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-m-stop",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        130.0,
                        346.0,
                        60.0,
                        22.0
                    ],
                    "text": "stop"
                }
            },
            {
                "box": {
                    "id": "obj-b-clear",
                    "presentation": 1,
                    "presentation_rect": [
                        240.0,
                        170.0,
                        32.0,
                        32.0
                    ],
                    "maxclass": "button",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "bang"
                    ],
                    "patching_rect": [
                        240.0,
                        312.0,
                        28.0,
                        28.0
                    ],
                    "bgcolor": [
                        0.8,
                        0.5,
                        0.2,
                        1.0
                    ]
                }
            },
            {
                "box": {
                    "id": "obj-c-clear",
                    "presentation": 1,
                    "presentation_rect": [
                        276.0,
                        178.0,
                        150.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        274.0,
                        316.0,
                        140.0,
                        20.0
                    ],
                    "text": "CLEAR (kick all)"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-m-clear",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        240.0,
                        346.0,
                        60.0,
                        22.0
                    ],
                    "text": "clear"
                }
            },
            {
                "box": {
                    "id": "obj-h-status",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        392.0,
                        600.0,
                        20.0
                    ],
                    "text": "\u2500\u2500 STATUS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
                }
            },
            {
                "box": {
                    "id": "obj-c-url-l",
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        44.0,
                        130.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        420.0,
                        130.0,
                        20.0
                    ],
                    "text": "Local URL:"
                }
            },
            {
                "box": {
                    "id": "obj-c-url",
                    "presentation": 1,
                    "presentation_rect": [
                        150.0,
                        44.0,
                        1100.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        90.0,
                        420.0,
                        500.0,
                        20.0
                    ],
                    "text": "(not started)"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-p-url",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        90.0,
                        446.0,
                        90.0,
                        22.0
                    ],
                    "text": "prepend set"
                }
            },
            {
                "box": {
                    "id": "obj-c-status-l",
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        120.0,
                        50.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        450.0,
                        60.0,
                        20.0
                    ],
                    "text": "Status:"
                }
            },
            {
                "box": {
                    "id": "obj-c-status",
                    "presentation": 1,
                    "presentation_rect": [
                        70.0,
                        120.0,
                        800.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        90.0,
                        450.0,
                        500.0,
                        20.0
                    ],
                    "text": "\u2014"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-p-status",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        90.0,
                        474.0,
                        90.0,
                        22.0
                    ],
                    "text": "prepend set"
                }
            },
            {
                "box": {
                    "id": "obj-c-roster-l",
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        144.0,
                        50.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        480.0,
                        60.0,
                        20.0
                    ],
                    "text": "Roster:"
                }
            },
            {
                "box": {
                    "id": "obj-c-roster",
                    "presentation": 1,
                    "presentation_rect": [
                        70.0,
                        144.0,
                        800.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        90.0,
                        480.0,
                        500.0,
                        20.0
                    ],
                    "text": "(none)"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-p-roster",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        90.0,
                        504.0,
                        90.0,
                        22.0
                    ],
                    "text": "prepend set"
                }
            },
            {
                "box": {
                    "id": "obj-c-started-l",
                    "presentation": 1,
                    "presentation_rect": [
                        900.0,
                        120.0,
                        70.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        510.0,
                        80.0,
                        20.0
                    ],
                    "text": "Started:"
                }
            },
            {
                "box": {
                    "id": "obj-i-started",
                    "presentation": 1,
                    "presentation_rect": [
                        970.0,
                        118.0,
                        24.0,
                        24.0
                    ],
                    "maxclass": "live.toggle",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [
                        "",
                        ""
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "started",
                            "parameter_shortname": "started",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                0
                            ]
                        }
                    },
                    "patching_rect": [
                        90.0,
                        508.0,
                        24.0,
                        24.0
                    ]
                }
            },
            {
                "box": {
                    "id": "obj-c-admin-l",
                    "presentation": 1,
                    "presentation_rect": [
                        1000.0,
                        120.0,
                        60.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        140.0,
                        510.0,
                        100.0,
                        20.0
                    ],
                    "text": "Admins:"
                }
            },
            {
                "box": {
                    "id": "obj-n-admin",
                    "presentation": 1,
                    "presentation_rect": [
                        1060.0,
                        118.0,
                        50.0,
                        24.0
                    ],
                    "maxclass": "number",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [
                        "",
                        "bang"
                    ],
                    "patching_rect": [
                        210.0,
                        508.0,
                        50.0,
                        24.0
                    ]
                }
            },
            {
                "box": {
                    "id": "obj-h-osc",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        560.0,
                        600.0,
                        20.0
                    ],
                    "text": "\u2500\u2500 OSC RECEIVE (sensor streams from phones, via UDP) \u2500\u2500\u2500\u2500"
                }
            },
            {
                "box": {
                    "id": "obj-c-osc-hint",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        584.0,
                        700.0,
                        20.0
                    ],
                    "text": "[udpreceive 7400] receives OSC FullPackets. Max 9 has no built-in OSC-to-message parser, so for routing-by-address install CNMAT Externals and wire [OSC-route /user] downstream. The same sensor data is also available via the SERVER outlet's [route sensor] path below \u2014 no OSC parser needed."
                }
            },
            {
                "box": {
                    "id": "obj-udprecv",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        20.0,
                        612.0,
                        140.0,
                        22.0
                    ],
                    "text": "udpreceive 7400"
                }
            },
            {
                "box": {
                    "id": "obj-print-osc",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        696.0,
                        90.0,
                        22.0
                    ],
                    "text": "print OSC"
                }
            },
            {
                "box": {
                    "id": "obj-c-osc-note",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        170.0,
                        612.0,
                        700.0,
                        20.0
                    ],
                    "text": "OSC port is mirrored automatically when you change the OSC Port number above \u2014 see [setoscport $1] message."
                }
            },
            {
                "box": {
                    "id": "obj-c-osc-note2",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        170.0,
                        668.0,
                        700.0,
                        20.0
                    ],
                    "text": "Right outlet of [route /user] catches unmatched addresses for debugging."
                }
            },
            {
                "box": {
                    "id": "obj-h-server",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        740.0,
                        600.0,
                        20.0
                    ],
                    "text": "\u2500\u2500 SERVER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-loadbang",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "bang"
                    ],
                    "patching_rect": [
                        1180.0,
                        740.0,
                        80.0,
                        22.0
                    ],
                    "text": "loadbang"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-delay-init",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        "bang"
                    ],
                    "patching_rect": [
                        1180.0,
                        768.0,
                        80.0,
                        22.0
                    ],
                    "text": "delay 500"
                }
            },
            {
                "box": {
                    "id": "obj-node",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [
                        "",
                        "bang"
                    ],
                    "patching_rect": [
                        20.0,
                        768.0,
                        240.0,
                        22.0
                    ],
                    "text": "node.script server.js @watch 1 @autostart 1"
                }
            },
            {
                "box": {
                    "id": "obj-route",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 13,
                    "outlettype": [
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        ""
                    ],
                    "patching_rect": [
                        20.0,
                        796.0,
                        720.0,
                        22.0
                    ],
                    "text": "route performer roster status url started admincount sensor cloud audience monitor focus detail"
                }
            },
            {
                "box": {
                    "id": "obj-route-print",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [
                        "",
                        ""
                    ],
                    "patching_rect": [
                        940.0,
                        740.0,
                        130.0,
                        22.0
                    ],
                    "text": "route monitor"
                }
            },
            {
                "box": {
                    "id": "obj-print-server",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        940.0,
                        768.0,
                        110.0,
                        22.0
                    ],
                    "text": "print SERVER"
                }
            },
            {
                "box": {
                    "id": "obj-c-server-note",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        280.0,
                        768.0,
                        640.0,
                        20.0
                    ],
                    "text": "@watch 1 reloads on save. Right-click node.script \u2192 Debug to attach Chrome DevTools."
                }
            },
            {
                "box": {
                    "id": "obj-h-out",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        700.0,
                        84.0,
                        500.0,
                        20.0
                    ],
                    "text": "\u2500\u2500 OUTPUT TO PHONES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
                }
            },
            {
                "box": {
                    "id": "obj-c-out-hint",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        700.0,
                        108.0,
                        500.0,
                        40.0
                    ],
                    "text": "Click a preset message, or wire your own. Broadcast (no name) reaches every joined phone; <name>to forms target one performer."
                }
            },
            {
                "box": {
                    "id": "obj-msg-vibrate-100",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        700.0,
                        156.0,
                        110.0,
                        22.0
                    ],
                    "text": "vibrate 100"
                }
            },
            {
                "box": {
                    "id": "obj-msg-vibrate-500",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        820.0,
                        156.0,
                        110.0,
                        22.0
                    ],
                    "text": "vibrate 500"
                }
            },
            {
                "box": {
                    "id": "obj-msg-speak",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        700.0,
                        184.0,
                        230.0,
                        22.0
                    ],
                    "text": "speak hello from Max"
                }
            },
            {
                "box": {
                    "id": "obj-msg-beep",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        700.0,
                        212.0,
                        110.0,
                        22.0
                    ],
                    "text": "beep 440 150"
                }
            },
            {
                "box": {
                    "id": "obj-msg-beep-hi",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        820.0,
                        212.0,
                        110.0,
                        22.0
                    ],
                    "text": "beep 880 80"
                }
            },
            {
                "box": {
                    "id": "obj-msg-display",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        700.0,
                        240.0,
                        230.0,
                        22.0
                    ],
                    "text": "display hello from Max"
                }
            },
            {
                "box": {
                    "id": "obj-c-synth-h",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        700.0,
                        272.0,
                        500.0,
                        20.0
                    ],
                    "text": "Synth (on the phone's Output tab):"
                }
            },
            {
                "box": {
                    "id": "obj-msg-synth-osc",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        700.0,
                        296.0,
                        110.0,
                        22.0
                    ],
                    "text": "synthmode osc"
                }
            },
            {
                "box": {
                    "id": "obj-msg-synth-fm",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        820.0,
                        296.0,
                        110.0,
                        22.0
                    ],
                    "text": "synthmode fm"
                }
            },
            {
                "box": {
                    "id": "obj-msg-synth-wt",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        940.0,
                        296.0,
                        120.0,
                        22.0
                    ],
                    "text": "synthmode wavetable"
                }
            },
            {
                "box": {
                    "id": "obj-msg-noteon",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        700.0,
                        324.0,
                        110.0,
                        22.0
                    ],
                    "text": "synthnote 60 100"
                }
            },
            {
                "box": {
                    "id": "obj-msg-noteoff",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        820.0,
                        324.0,
                        110.0,
                        22.0
                    ],
                    "text": "synthnote 60 0"
                }
            },
            {
                "box": {
                    "id": "obj-msg-cutoff-lo",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        700.0,
                        352.0,
                        110.0,
                        22.0
                    ],
                    "text": "synthset cutoff 800"
                }
            },
            {
                "box": {
                    "id": "obj-msg-cutoff-hi",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        820.0,
                        352.0,
                        110.0,
                        22.0
                    ],
                    "text": "synthset cutoff 8000"
                }
            },
            {
                "box": {
                    "id": "obj-msg-modindex",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        700.0,
                        380.0,
                        230.0,
                        22.0
                    ],
                    "text": "synthset modIndex 600"
                }
            },
            {
                "box": {
                    "id": "obj-c-out-target",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        700.0,
                        412.0,
                        500.0,
                        60.0
                    ],
                    "text": "Target a single performer with the *to forms:\nvibrateto <name> <ms>   speakto <name> <text>   beepto <name> <freq> <ms>\nsynthnoteto <name> <note> <vel>   synthsetto <name> <param> <value>"
                }
            },
            {
                "box": {
                    "id": "obj-h-cloud",
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        220.0,
                        700.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        700.0,
                        488.0,
                        500.0,
                        20.0
                    ],
                    "text": "\u2500\u2500 CLOUD RELAY (audience + remote performers) \u2500\u2500\u2500\u2500\u2500\u2500"
                }
            },
            {
                "box": {
                    "id": "obj-c-cloud-hint",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        700.0,
                        512.0,
                        500.0,
                        40.0
                    ],
                    "text": "LAN keeps working independently. The cloud relay (deployed once at cloud/worker) bridges to remote performers and audience members for any piece built on this template."
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-def-piece",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        1200.0,
                        610.0,
                        260.0,
                        22.0
                    ],
                    "text": "setpiece multi-user-template"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-def-room",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        1200.0,
                        636.0,
                        140.0,
                        22.0
                    ],
                    "text": "setroom main"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-def-cloudurl",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        1200.0,
                        662.0,
                        380.0,
                        22.0
                    ],
                    "text": "setcloudurl wss://mu-relay.jannone-544.workers.dev"
                }
            },
            {
                "box": {
                    "id": "obj-b-cloudon",
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        282.0,
                        32.0,
                        32.0
                    ],
                    "maxclass": "button",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "bang"
                    ],
                    "patching_rect": [
                        700.0,
                        672.0,
                        28.0,
                        28.0
                    ],
                    "bgcolor": [
                        0.2,
                        0.6,
                        0.2,
                        1.0
                    ]
                }
            },
            {
                "box": {
                    "id": "obj-c-cloudon",
                    "presentation": 1,
                    "presentation_rect": [
                        56.0,
                        288.0,
                        130.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        734.0,
                        676.0,
                        100.0,
                        20.0
                    ],
                    "text": "Cloud connect"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-m-cloudon",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        700.0,
                        706.0,
                        80.0,
                        22.0
                    ],
                    "text": "cloudon"
                }
            },
            {
                "box": {
                    "id": "obj-b-cloudoff",
                    "presentation": 1,
                    "presentation_rect": [
                        190.0,
                        282.0,
                        32.0,
                        32.0
                    ],
                    "maxclass": "button",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "bang"
                    ],
                    "patching_rect": [
                        860.0,
                        672.0,
                        28.0,
                        28.0
                    ],
                    "bgcolor": [
                        0.7,
                        0.3,
                        0.3,
                        1.0
                    ]
                }
            },
            {
                "box": {
                    "id": "obj-c-cloudoff",
                    "presentation": 1,
                    "presentation_rect": [
                        226.0,
                        288.0,
                        100.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        894.0,
                        676.0,
                        100.0,
                        20.0
                    ],
                    "text": "Disconnect"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-m-cloudoff",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        860.0,
                        706.0,
                        80.0,
                        22.0
                    ],
                    "text": "cloudoff"
                }
            },
            {
                "box": {
                    "id": "obj-i-cloud-connected",
                    "presentation": 1,
                    "presentation_rect": [
                        340.0,
                        282.0,
                        24.0,
                        24.0
                    ],
                    "maxclass": "live.toggle",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [
                        "",
                        ""
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "cloudConnected",
                            "parameter_shortname": "cloudConnected",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                0
                            ]
                        }
                    },
                    "patching_rect": [
                        1020.0,
                        672.0,
                        24.0,
                        24.0
                    ]
                }
            },
            {
                "box": {
                    "id": "obj-c-cloud-conn-l",
                    "presentation": 1,
                    "presentation_rect": [
                        368.0,
                        288.0,
                        140.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        1050.0,
                        676.0,
                        130.0,
                        20.0
                    ],
                    "text": "(cloud connected)"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-def-sitebase",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        1200.0,
                        688.0,
                        360.0,
                        22.0
                    ],
                    "text": "setsitebase https://john.jann.one/multi-user-template/"
                }
            },
            {
                "box": {
                    "id": "obj-c-perform-l",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        700.0,
                        504.0,
                        130.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        68.0,
                        130.0,
                        20.0
                    ],
                    "text": "Performer URL:"
                }
            },
            {
                "box": {
                    "id": "obj-c-perform",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        700.0,
                        524.0,
                        600.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        150.0,
                        68.0,
                        1100.0,
                        20.0
                    ],
                    "text": "(set Cloud URL, Piece, Room, Site base)"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-p-perform",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        700.0,
                        548.0,
                        90.0,
                        22.0
                    ],
                    "text": "prepend set"
                }
            },
            {
                "box": {
                    "id": "obj-c-audience-l",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        700.0,
                        580.0,
                        130.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        92.0,
                        130.0,
                        20.0
                    ],
                    "text": "Audience URL:"
                }
            },
            {
                "box": {
                    "id": "obj-c-audience",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        700.0,
                        600.0,
                        600.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        150.0,
                        92.0,
                        1100.0,
                        20.0
                    ],
                    "text": "(set Cloud URL, Piece, Room, Site base)"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-p-audience",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        700.0,
                        624.0,
                        90.0,
                        22.0
                    ],
                    "text": "prepend set"
                }
            },
            {
                "box": {
                    "id": "obj-cellblock",
                    "maxclass": "jit.cellblock",
                    "numinlets": 2,
                    "numoutlets": 4,
                    "outlettype": [
                        "list",
                        "",
                        "",
                        ""
                    ],
                    "patching_rect": [
                        20.0,
                        860.0,
                        940.0,
                        360.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        420.0,
                        800.0,
                        460.0
                    ],
                    "rows": 16,
                    "cols": 16,
                    "colhead": 0,
                    "rowhead": 0,
                    "hscroll": 1,
                    "vscroll": 1,
                    "selmode": 1,
                    "bgcolor": [
                        0.1,
                        0.1,
                        0.1,
                        1.0
                    ],
                    "fgcolor": [
                        0.92,
                        0.92,
                        0.92,
                        1.0
                    ],
                    "bordercolor": [
                        0.16,
                        0.16,
                        0.16,
                        1.0
                    ],
                    "gridlinecolor": [
                        0.18,
                        0.18,
                        0.18,
                        1.0
                    ]
                }
            },
            {
                "box": {
                    "id": "obj-detail-cellblock",
                    "maxclass": "jit.cellblock",
                    "numinlets": 2,
                    "numoutlets": 4,
                    "outlettype": [
                        "list",
                        "",
                        "",
                        ""
                    ],
                    "patching_rect": [
                        980.0,
                        860.0,
                        480.0,
                        360.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        840.0,
                        440.0,
                        480.0,
                        220.0
                    ],
                    "rows": 26,
                    "cols": 2,
                    "colhead": 0,
                    "rowhead": 0,
                    "hscroll": 0,
                    "vscroll": 1,
                    "selmode": 0,
                    "bgcolor": [
                        0.1,
                        0.1,
                        0.1,
                        1.0
                    ],
                    "fgcolor": [
                        0.92,
                        0.92,
                        0.92,
                        1.0
                    ],
                    "bordercolor": [
                        0.16,
                        0.16,
                        0.16,
                        1.0
                    ],
                    "gridlinecolor": [
                        0.18,
                        0.18,
                        0.18,
                        1.0
                    ]
                }
            },
            {
                "box": {
                    "id": "obj-c-detail-h",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        980.0,
                        838.0,
                        480.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        840.0,
                        398.0,
                        220.0,
                        20.0
                    ],
                    "fontface": 1,
                    "fontname": "Courier",
                    "text": "\u2500\u2500 DETAIL \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
                }
            },
            {
                "box": {
                    "id": "obj-c-video-l",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        1500.0,
                        856.0,
                        200.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        840.0,
                        666.0,
                        200.0,
                        20.0
                    ],
                    "fontname": "Courier",
                    "text": "Video (Camera tab \u2192 Stream to Max)"
                }
            },
            {
                "box": {
                    "id": "obj-pwindow",
                    "maxclass": "jit.pwindow",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [
                        "",
                        ""
                    ],
                    "patching_rect": [
                        1500.0,
                        880.0,
                        240.0,
                        180.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        840.0,
                        688.0,
                        240.0,
                        180.0
                    ],
                    "border": 1
                }
            },
            {
                "box": {
                    "id": "obj-c-mic-l",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        1500.0,
                        1070.0,
                        200.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        1090.0,
                        666.0,
                        200.0,
                        20.0
                    ],
                    "fontname": "Courier",
                    "text": "Mic level (rms / peak)"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-unpack-level",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [
                        "float",
                        "float"
                    ],
                    "patching_rect": [
                        1500.0,
                        1070.0,
                        80.0,
                        22.0
                    ],
                    "text": "unpack 0. 0."
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-sig",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "signal"
                    ],
                    "patching_rect": [
                        1500.0,
                        1094.0,
                        60.0,
                        22.0
                    ],
                    "text": "sig~ 0"
                }
            },
            {
                "box": {
                    "id": "obj-meter",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "float"
                    ],
                    "patching_rect": [
                        1500.0,
                        1120.0,
                        220.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        1090.0,
                        688.0,
                        220.0,
                        22.0
                    ],
                    "text": "meter~"
                }
            },
            {
                "box": {
                    "id": "obj-c-wave-l",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        1500.0,
                        1148.0,
                        220.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        1090.0,
                        716.0,
                        220.0,
                        20.0
                    ],
                    "fontname": "Courier",
                    "text": "Waveform (live.scope~ on level signal)"
                }
            },
            {
                "box": {
                    "id": "obj-scope",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        1500.0,
                        1172.0,
                        220.0,
                        130.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        1090.0,
                        740.0,
                        220.0,
                        130.0
                    ],
                    "text": "live.scope~"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-dsp-on",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        1700.0,
                        740.0,
                        100.0,
                        22.0
                    ],
                    "text": "startwindow"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-ezdac",
                    "maxclass": "ezdac~",
                    "numinlets": 2,
                    "numoutlets": 0,
                    "patching_rect": [
                        1700.0,
                        768.0,
                        45.0,
                        45.0
                    ]
                }
            },
            {
                "box": {
                    "id": "obj-c-focus-name",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        980.0,
                        816.0,
                        480.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        840.0,
                        418.0,
                        480.0,
                        20.0
                    ],
                    "text": "(click a row in the Monitor to focus)"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-route-focus",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 8,
                    "outlettype": [
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        ""
                    ],
                    "patching_rect": [
                        660.0,
                        826.0,
                        360.0,
                        22.0
                    ],
                    "text": "route name roles isadmin conn level videoframe audio"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-p-focus-name",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        660.0,
                        850.0,
                        110.0,
                        22.0
                    ],
                    "text": "prepend set"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-p-cellclick",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        20.0,
                        1230.0,
                        130.0,
                        22.0
                    ],
                    "text": "prepend cellclick"
                }
            },
            {
                "box": {
                    "id": "obj-c-cellblock-h",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        20.0,
                        838.0,
                        940.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        398.0,
                        600.0,
                        20.0
                    ],
                    "fontface": 1,
                    "fontname": "Courier",
                    "text": "\u2500\u2500 MONITOR \u2014 latest data per performer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
                }
            },
            {
                "box": {
                    "id": "obj-c-cloud-status-l",
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        322.0,
                        100.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        700.0,
                        740.0,
                        100.0,
                        20.0
                    ],
                    "text": "Cloud status:"
                }
            },
            {
                "box": {
                    "id": "obj-c-cloud-status",
                    "presentation": 1,
                    "presentation_rect": [
                        120.0,
                        322.0,
                        1100.0,
                        20.0
                    ],
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        800.0,
                        740.0,
                        400.0,
                        20.0
                    ],
                    "text": "\u2014"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-p-cloud-status",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        800.0,
                        764.0,
                        90.0,
                        22.0
                    ],
                    "text": "prepend set"
                }
            },
            {
                "box": {
                    "id": "obj-route-cloud",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 5,
                    "outlettype": [
                        "",
                        "",
                        "",
                        "",
                        ""
                    ],
                    "patching_rect": [
                        700.0,
                        796.0,
                        360.0,
                        22.0
                    ],
                    "text": "route status connected performurl audienceurl"
                }
            },
            {
                "box": {
                    "id": "obj-print-audience",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        940.0,
                        796.0,
                        130.0,
                        22.0
                    ],
                    "text": "print AUDIENCE"
                }
            },
            {
                "box": {
                    "id": "obj-c-coltoggles-h",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2000.0,
                        870.0,
                        200.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        20.0,
                        904.0,
                        110.0,
                        20.0
                    ],
                    "fontname": "Courier",
                    "text": "Show columns:"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Conn",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        900.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        147.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Conn",
                            "parameter_shortname": "Conn",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Conn",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        900.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        130.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Conn"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Conn",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        900.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Conn $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Roles",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        956.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        199.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Roles",
                            "parameter_shortname": "Roles",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Roles",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        956.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        182.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Roles"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Roles",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        956.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Roles $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Motion",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1012.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        251.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Motion",
                            "parameter_shortname": "Motion",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Motion",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1012.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        234.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Motion"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Motion",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1012.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Motion $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Orient",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1068.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        303.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Orient",
                            "parameter_shortname": "Orient",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Orient",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1068.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        286.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Orient"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Orient",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1068.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Orient $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Head",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1124.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        355.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Head",
                            "parameter_shortname": "Head",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Head",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1124.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        338.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Head"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Head",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1124.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Head $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Geo",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1180.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        407.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Geo",
                            "parameter_shortname": "Geo",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Geo",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1180.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        390.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Geo"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Geo",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1180.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Geo $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Mic",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1236.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        459.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Mic",
                            "parameter_shortname": "Mic",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Mic",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1236.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        442.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Mic"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Mic",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1236.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Mic $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Touch",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1292.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        511.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Touch",
                            "parameter_shortname": "Touch",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Touch",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1292.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        494.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Touch"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Touch",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1292.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Touch $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Btn",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1348.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        563.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Btn",
                            "parameter_shortname": "Btn",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Btn",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1348.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        546.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Btn"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Btn",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1348.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Btn $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Slid",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1404.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        615.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Slid",
                            "parameter_shortname": "Slid",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Slid",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1404.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        598.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Slid"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Slid",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1404.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Slid $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Dial",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1460.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        667.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Dial",
                            "parameter_shortname": "Dial",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Dial",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1460.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        650.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Dial"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Dial",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1460.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Dial $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-MIDI",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1516.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        719.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_MIDI",
                            "parameter_shortname": "MIDI",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-MIDI",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1516.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        702.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "MIDI"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-MIDI",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1516.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol MIDI $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Batt",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1572.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        771.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Batt",
                            "parameter_shortname": "Batt",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Batt",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1572.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        754.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Batt"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Batt",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1572.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Batt $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Speech",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1628.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        823.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Speech",
                            "parameter_shortname": "Speech",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Speech",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1628.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        806.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Speech"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Speech",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1628.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Speech $1"
                }
            },
            {
                "box": {
                    "id": "obj-tog-Upd",
                    "maxclass": "toggle",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "int"
                    ],
                    "patching_rect": [
                        2000.0,
                        1684.0,
                        22.0,
                        22.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        875.0,
                        900.0,
                        18.0,
                        18.0
                    ],
                    "parameter_enable": 1,
                    "saved_attribute_attributes": {
                        "valueof": {
                            "parameter_longname": "monCol_Upd",
                            "parameter_shortname": "Upd",
                            "parameter_type": 2,
                            "parameter_initial_enable": 1,
                            "parameter_initial": [
                                1
                            ]
                        }
                    }
                }
            },
            {
                "box": {
                    "id": "obj-c-tog-Upd",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        2024.0,
                        1684.0,
                        60.0,
                        20.0
                    ],
                    "presentation": 1,
                    "presentation_rect": [
                        858.0,
                        922.0,
                        48.0,
                        14.0
                    ],
                    "fontsize": 10.0,
                    "text": "Upd"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-msg-tog-Upd",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        2090.0,
                        1684.0,
                        200.0,
                        22.0
                    ],
                    "text": "setmoncol Upd $1"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-p-vid-import",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        1500.0,
                        820.0,
                        140.0,
                        22.0
                    ],
                    "text": "prepend importmovie"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-t-vid",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [
                        "bang",
                        ""
                    ],
                    "patching_rect": [
                        1500.0,
                        844.0,
                        60.0,
                        22.0
                    ],
                    "text": "t b s"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-jitmat-video",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        "jit_matrix"
                    ],
                    "patching_rect": [
                        1500.0,
                        868.0,
                        240.0,
                        22.0
                    ],
                    "text": "jit.matrix mu_focus_video 4 char 320 240 @usesrcdim 1"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-v8-audio",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [
                        1800.0,
                        1000.0,
                        160.0,
                        22.0
                    ],
                    "text": "v8 audio-bridge.js"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-buf-audio",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 1,
                    "outlettype": [
                        ""
                    ],
                    "patching_rect": [
                        1800.0,
                        1030.0,
                        220.0,
                        22.0
                    ],
                    "text": "buffer~ mu_audio 96000 1"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-phasor",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [
                        "signal"
                    ],
                    "patching_rect": [
                        1800.0,
                        1060.0,
                        80.0,
                        22.0
                    ],
                    "text": "phasor~ 0.5"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-wave",
                    "maxclass": "newobj",
                    "numinlets": 3,
                    "numoutlets": 1,
                    "outlettype": [
                        "signal"
                    ],
                    "patching_rect": [
                        1800.0,
                        1090.0,
                        120.0,
                        22.0
                    ],
                    "text": "wave~ mu_audio"
                }
            },
            {
                "box": {
                    "hidden": 1,
                    "id": "obj-dac",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 0,
                    "patching_rect": [
                        1800.0,
                        1120.0,
                        60.0,
                        22.0
                    ],
                    "text": "dac~ 1 2"
                }
            }
        ],
        "lines": [
            {
                "patchline": {
                    "source": [
                        "obj-n-port",
                        0
                    ],
                    "destination": [
                        "obj-m-port",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-m-port",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-n-oscport",
                        0
                    ],
                    "destination": [
                        "obj-m-oscport",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-m-oscport",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-n-oscport",
                        0
                    ],
                    "destination": [
                        "obj-udprecv",
                        0
                    ],
                    "midpoints": [
                        139.5,
                        600.0,
                        29.5,
                        600.0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-b-pw",
                        0
                    ],
                    "destination": [
                        "obj-dialog-pw",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-dialog-pw",
                        0
                    ],
                    "destination": [
                        "obj-p-pw",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-p-pw",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-t-roles",
                        0
                    ],
                    "destination": [
                        "obj-p-roles",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-p-roles",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-b-start",
                        0
                    ],
                    "destination": [
                        "obj-m-start",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-m-start",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-b-stop",
                        0
                    ],
                    "destination": [
                        "obj-m-stop",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-m-stop",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-b-clear",
                        0
                    ],
                    "destination": [
                        "obj-m-clear",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-m-clear",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-node",
                        0
                    ],
                    "destination": [
                        "obj-route",
                        0
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-node",
                        0
                    ],
                    "destination": [
                        "obj-route-print",
                        0
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route-print",
                        1
                    ],
                    "destination": [
                        "obj-print-server",
                        0
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route",
                        3
                    ],
                    "destination": [
                        "obj-p-url",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-p-url",
                        0
                    ],
                    "destination": [
                        "obj-c-url",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route",
                        2
                    ],
                    "destination": [
                        "obj-p-status",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-p-status",
                        0
                    ],
                    "destination": [
                        "obj-c-status",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route",
                        1
                    ],
                    "destination": [
                        "obj-p-roster",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-p-roster",
                        0
                    ],
                    "destination": [
                        "obj-c-roster",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route",
                        4
                    ],
                    "destination": [
                        "obj-i-started",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route",
                        5
                    ],
                    "destination": [
                        "obj-n-admin",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-udprecv",
                        0
                    ],
                    "destination": [
                        "obj-print-osc",
                        0
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-vibrate-100",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-vibrate-500",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-speak",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-beep",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-beep-hi",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-display",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-synth-osc",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-synth-fm",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-synth-wt",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-noteon",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-noteoff",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-cutoff-lo",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-cutoff-hi",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-modindex",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-b-cloudon",
                        0
                    ],
                    "destination": [
                        "obj-m-cloudon",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-m-cloudon",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-b-cloudoff",
                        0
                    ],
                    "destination": [
                        "obj-m-cloudoff",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-m-cloudoff",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route",
                        7
                    ],
                    "destination": [
                        "obj-route-cloud",
                        0
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route-cloud",
                        0
                    ],
                    "destination": [
                        "obj-p-cloud-status",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-p-cloud-status",
                        0
                    ],
                    "destination": [
                        "obj-c-cloud-status",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route-cloud",
                        1
                    ],
                    "destination": [
                        "obj-i-cloud-connected",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route",
                        8
                    ],
                    "destination": [
                        "obj-print-audience",
                        0
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route",
                        9
                    ],
                    "destination": [
                        "obj-cellblock",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route",
                        10
                    ],
                    "destination": [
                        "obj-route-focus",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route",
                        11
                    ],
                    "destination": [
                        "obj-detail-cellblock",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route-focus",
                        0
                    ],
                    "destination": [
                        "obj-p-focus-name",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-p-focus-name",
                        0
                    ],
                    "destination": [
                        "obj-c-focus-name",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route-focus",
                        4
                    ],
                    "destination": [
                        "obj-unpack-level",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-unpack-level",
                        0
                    ],
                    "destination": [
                        "obj-sig",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-sig",
                        0
                    ],
                    "destination": [
                        "obj-meter",
                        0
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-sig",
                        0
                    ],
                    "destination": [
                        "obj-scope",
                        0
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-loadbang",
                        0
                    ],
                    "destination": [
                        "obj-msg-dsp-on",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-dsp-on",
                        0
                    ],
                    "destination": [
                        "obj-ezdac",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-cellblock",
                        0
                    ],
                    "destination": [
                        "obj-p-cellclick",
                        0
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-p-cellclick",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-loadbang",
                        0
                    ],
                    "destination": [
                        "obj-delay-init",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-delay-init",
                        0
                    ],
                    "destination": [
                        "obj-def-piece",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-delay-init",
                        0
                    ],
                    "destination": [
                        "obj-def-room",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-delay-init",
                        0
                    ],
                    "destination": [
                        "obj-def-cloudurl",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-delay-init",
                        0
                    ],
                    "destination": [
                        "obj-def-sitebase",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-def-piece",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-def-room",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-def-cloudurl",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-def-sitebase",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route-cloud",
                        2
                    ],
                    "destination": [
                        "obj-p-perform",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-p-perform",
                        0
                    ],
                    "destination": [
                        "obj-c-perform",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route-cloud",
                        3
                    ],
                    "destination": [
                        "obj-p-audience",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-p-audience",
                        0
                    ],
                    "destination": [
                        "obj-c-audience",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Conn",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Conn",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Conn",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Roles",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Roles",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Roles",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Motion",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Motion",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Motion",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Orient",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Orient",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Orient",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Head",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Head",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Head",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Geo",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Geo",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Geo",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Mic",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Mic",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Mic",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Touch",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Touch",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Touch",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Btn",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Btn",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Btn",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Slid",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Slid",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Slid",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Dial",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Dial",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Dial",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-MIDI",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-MIDI",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-MIDI",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Batt",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Batt",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Batt",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Speech",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Speech",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Speech",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-tog-Upd",
                        0
                    ],
                    "destination": [
                        "obj-msg-tog-Upd",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-msg-tog-Upd",
                        0
                    ],
                    "destination": [
                        "obj-node",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route-focus",
                        5
                    ],
                    "destination": [
                        "obj-p-vid-import",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-p-vid-import",
                        0
                    ],
                    "destination": [
                        "obj-t-vid",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-t-vid",
                        1
                    ],
                    "destination": [
                        "obj-jitmat-video",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-t-vid",
                        0
                    ],
                    "destination": [
                        "obj-jitmat-video",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-jitmat-video",
                        0
                    ],
                    "destination": [
                        "obj-pwindow",
                        0
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-route-focus",
                        6
                    ],
                    "destination": [
                        "obj-v8-audio",
                        0
                    ],
                    "hidden": 1
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-phasor",
                        0
                    ],
                    "destination": [
                        "obj-wave",
                        0
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-wave",
                        0
                    ],
                    "destination": [
                        "obj-dac",
                        0
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-wave",
                        0
                    ],
                    "destination": [
                        "obj-dac",
                        1
                    ]
                }
            },
            {
                "patchline": {
                    "source": [
                        "obj-wave",
                        0
                    ],
                    "destination": [
                        "obj-scope",
                        0
                    ]
                }
            }
        ]
    }
}