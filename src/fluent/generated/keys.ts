import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: 'cc69c83e102f4f349d4516378a736efb'
                    }
                    br_incident_resolved_comment: {
                        table: 'sys_script'
                        id: 'afb7f7d1e2d8435781f3ae5b65700b53'
                    }
                    br_set_priority_on_insert: {
                        table: 'sys_script'
                        id: '21049ec3956f4b198d2d0460f7eb820c'
                    }
                    br_stamp_reviewed_on_close: {
                        table: 'sys_script'
                        id: '4af7a4c94d184d56afbf90546cfab0c0'
                    }
                    cs_task_onload_helper: {
                        table: 'sys_script_client'
                        id: 'dfca531c8d69432794715cb87e725d51'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '90241ca84f9946deab9af8689abad97f'
                    }
                    si_fluentplay_utils: {
                        table: 'sys_script_include'
                        id: '9a1a8b8376274262a6da17ca8a077def'
                    }
                    src_server_businessRuleScripts_js: {
                        table: 'sys_module'
                        id: 'aef2450f1fc84431808e4e42b3e35e15'
                    }
                    src_server_FluentPlayUtils_server_js: {
                        table: 'sys_module'
                        id: 'e752ac61670f4f569267bfc662322ffd'
                    }
                }
                composite: [
                    {
                        table: 'sys_choice'
                        id: '0193f7104d3e43b48219c716f2daa759'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_custom_category'
                            value: 'hardware'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '0456b7a583bf4350b96f6ed0deaad3a8'
                        key: {
                            sys_ui_section: {
                                id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                                key: {
                                    name: 'x_146833_fluentp_0_task'
                                    caption: 'NULL'
                                    view: 'Default view'
                                    sys_domain: 'global'
                                }
                            }
                            element: 'assigned_to'
                            position: '1'
                        }
                    },
                    {
                        table: 'sys_ui_section'
                        id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            caption: 'NULL'
                            view: {
                                id: 'Default view'
                                key: {
                                    name: 'NULL'
                                }
                            }
                            sys_domain: 'global'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '10fb0bc06481412081b29490dc185711'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '16a953c00e2948199a7bb0aa1dadae84'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_custom_category'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1bb2eacf1413413b999fac523e329b55'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_priority_override'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1fa9d4464f91446e9b13e7ee6a7e3ed3'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_test_tag'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2ca795e31fae4182980851d7df1515c2'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '4056b7a583bf4350b96f6ed0deaad3aa'
                        key: {
                            sys_ui_section: {
                                id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                                key: {
                                    name: 'x_146833_fluentp_0_task'
                                    caption: 'NULL'
                                    view: 'Default view'
                                    sys_domain: 'global'
                                }
                            }
                            element: '.split'
                            position: '4'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '4056b7a583bf4350b96f6ed0deaad3c9'
                        key: {
                            sys_ui_section: {
                                id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                                key: {
                                    name: 'x_146833_fluentp_0_task'
                                    caption: 'NULL'
                                    view: 'Default view'
                                    sys_domain: 'global'
                                }
                            }
                            element: 'description'
                            position: '10'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '43283c6e68b24aec903d039ba87a15f5'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_channel_source'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '4456b7a583bf4350b96f6ed0deaad3c7'
                        key: {
                            sys_ui_section: {
                                id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                                key: {
                                    name: 'x_146833_fluentp_0_task'
                                    caption: 'NULL'
                                    view: 'Default view'
                                    sys_domain: 'global'
                                }
                            }
                            element: '.end_split'
                            position: '8'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '45cdcca12d334046b2471fde5f8e4124'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_custom_category'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '4856b7a583bf4350b96f6ed0deaad3a6'
                        key: {
                            sys_ui_section: {
                                id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                                key: {
                                    name: 'x_146833_fluentp_0_task'
                                    caption: 'NULL'
                                    view: 'Default view'
                                    sys_domain: 'global'
                                }
                            }
                            element: 'number'
                            position: '0'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '4856b7a583bf4350b96f6ed0deaad3c5'
                        key: {
                            sys_ui_section: {
                                id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                                key: {
                                    name: 'x_146833_fluentp_0_task'
                                    caption: 'NULL'
                                    view: 'Default view'
                                    sys_domain: 'global'
                                }
                            }
                            element: 'state'
                            position: '6'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: '4c56b7a583bf4350b96f6ed0deaad3ab'
                        key: {
                            sys_ui_section: {
                                id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                                key: {
                                    name: 'x_146833_fluentp_0_task'
                                    caption: 'NULL'
                                    view: 'Default view'
                                    sys_domain: 'global'
                                }
                            }
                            element: 'priority'
                            position: '5'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4cb22f0bdbab4e56bf8d5a77af25cb01'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_test_tag'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '54ea27a9833f4350b96f6ed0deaad3ef'
                        key: {
                            name: 'x_146833_fluentp_0.user'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '57484e7f07ea40898c30dedf6120e2a9'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_custom_category'
                            value: 'software'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5d79ebadcc354a99a37072a7075f3e2d'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_channel_source'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7aba633989bb4ddcb45fe9a9980e4217'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_custom_category'
                            value: 'network'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_number'
                        id: '8232f1ea48534ede94ec7a795812ec1a'
                        key: {
                            category: 'x_146833_fluentp_0_task'
                            prefix: 'FPT'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8805bdf6d3bd4c50af879b3511b6cd9b'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_custom_category'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'acaa92af730e4f3ebc4d63ac10021211'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b4db035758104c3f9e871ad339d70d8f'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_reviewed'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: 'c056b7a583bf4350b96f6ed0deaad3a9'
                        key: {
                            sys_ui_section: {
                                id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                                key: {
                                    name: 'x_146833_fluentp_0_task'
                                    caption: 'NULL'
                                    view: 'Default view'
                                    sys_domain: 'global'
                                }
                            }
                            element: 'cmdb_ci'
                            position: '2'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: 'c056b7a583bf4350b96f6ed0deaad3c8'
                        key: {
                            sys_ui_section: {
                                id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                                key: {
                                    name: 'x_146833_fluentp_0_task'
                                    caption: 'NULL'
                                    view: 'Default view'
                                    sys_domain: 'global'
                                }
                            }
                            element: 'short_description'
                            position: '9'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c43c2cbd67c6484a93dac503eaa11b31'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_reviewed'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: 'c456b7a583bf4350b96f6ed0deaad3c6'
                        key: {
                            sys_ui_section: {
                                id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                                key: {
                                    name: 'x_146833_fluentp_0_task'
                                    caption: 'NULL'
                                    view: 'Default view'
                                    sys_domain: 'global'
                                }
                            }
                            element: 'parent'
                            position: '7'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: 'cc56b7a583bf4350b96f6ed0deaad3aa'
                        key: {
                            sys_ui_section: {
                                id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                                key: {
                                    name: 'x_146833_fluentp_0_task'
                                    caption: 'NULL'
                                    view: 'Default view'
                                    sys_domain: 'global'
                                }
                            }
                            element: 'active'
                            position: '3'
                        }
                    },
                    {
                        table: 'sys_ui_element'
                        id: 'cc56b7a583bf4350b96f6ed0deaad3c9'
                        key: {
                            sys_ui_section: {
                                id: '0c56b7a583bf4350b96f6ed0deaad3a2'
                                key: {
                                    name: 'x_146833_fluentp_0_task'
                                    caption: 'NULL'
                                    view: 'Default view'
                                    sys_domain: 'global'
                                }
                            }
                            element: 'work_notes'
                            position: '11'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cd83da8dec2e47f2a4762bb7a53152b5'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_priority_override'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: 'd8ea27a9833f4350b96f6ed0deaad3d6'
                        key: {
                            name: 'x_146833_fluentp_0.admin'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f26f0a435b004690ab8cd127c58a7eaa'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'u_custom_category'
                            value: 'security'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fc0bed8f02e74277b681b54aa69f76bb'
                        key: {
                            name: 'x_146833_fluentp_0_task'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                ]
            }
        }
    }
}
